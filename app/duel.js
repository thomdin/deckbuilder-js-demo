/**
 * Duel logic, detached from the UI
 */
export default class Duel {
  constructor(card_list, deck_p1, deck_p2, starter) {
    this.turn = {
      draw: false,
      count: 0,
      placed: false,
      p_key: null,
      card_attacks: null,
      has_attacked: []
    }

    if (starter === "p1") {
      this.turn.p_key = "p1"
    } else if (starter === "p2") {
      this.turn.p_key = "p2"
    } else {
      throw new Error(`Allowed values for argument starter: "p1", "p2"`)
    }

    this.p1 = {
      deck: deck_p1.map((c, i) => {
        const card = structuredClone(card_list[c])
        card.uid = `p1-${i}`
        return card
      }),
      grave: [],
      hand: [],
      zones: { 0: null, 1: null, 2: null },
      lp: 4000
    }

    this.p2 = {
      deck: deck_p2.map((c, i) => {
        const card = structuredClone(card_list[c])
        card.uid = `p2-${i}`
        return card
      }),
      grave: [],
      hand: [],
      zones: { 0: null, 1: null, 2: null },
      lp: 4000
    }

    this.event_register = {
      shuffle: [],
      place: [],
      draw: [],
      start: [],
      initiate_attack: [],
      attack: [],
      lp_updated: [],
      card_destroyed: [],
      grave_updated: [],
      attack_finished: [],
      turn_change: [],
      end: []
    }
  }

  start() {
    this.shuffleDeck("p1")
    this.shuffleDeck("p2")

    this.fireEvent("start")

    this.draw("p1", 3, true)
    this.draw("p2", 3, true)
  }

  shuffleDeck(p_key) {
    shuffleArray(this[p_key].deck)
    this.fireEvent("shuffle", { p_key: p_key })
  }

  draw(p_key, amount = 1, ignoreTurn = false) {
    if (!ignoreTurn) {
      if (this.turn.draw) {
        throw new Error(`${p_key} cannot draw: The draw is already used up.`)
      }
      if (this.turn.p_key !== p_key) {
        throw new Error(`${p_key} cannot draw: Not your turn.`)
      }
    }
    const cards = []
    for (let i = 0; i < amount; i++) {
      const c = this[p_key].deck.pop()
      cards.push(c)
      this[p_key].hand.push(c)
    }

    this.fireEvent("draw", { p_key: p_key, cards: cards })
    return cards
  }

  placeCardFromHand(p_key, uid) {
    if (this.turn.placed) {
      throw new Error(`${p_key} cannot place: Already placed this turn.`)
    }
    if (p_key !== this.turn.p_key) {
      throw new Error(`${p_key} cannot place: Not your turn.`)
    }
    const empty_zones = Object.keys(this[p_key].zones)
      .filter(i => {
        return (this[p_key].zones[i] === null)
      })
    if (empty_zones.length === 0) {
      throw new Error(`${p_key} cannot place: No more empty zones.`)
    }
    const hand = this[p_key].hand
    for (let i = 0; i < hand.length; i++) {
      const c = this[p_key].hand[i]
      if (c.uid == uid) {
        const card = this[p_key].hand.splice(i, 1).pop()
        const zone_idx = empty_zones[0]
        if (this[p_key].zones[zone_idx] !== null) {
          throw new Error("Zone is already in use.")
        }
        this[p_key].zones[zone_idx] = card
        this.turn.placed = true
        this.fireEvent("place", { p_key: p_key, card: card, zone: zone_idx })
        return zone_idx
      }
    }
    throw new Error(`The card of uid ${uid} is not in the hand of player ${p_key}.`)
  }

  initiateAttack(p_key, zone_idx) {
    if (p_key !== this.turn.p_key)
      throw new Error(`${p_key} cannot attack: Not your turn.`)
    const card = this[p_key].zones[zone_idx]
    if (!card)
      throw new Error(`There is no card in the zone ${zone_idx} of ${p_key}.`)

    if (this.turn.has_attacked.includes(card.uid))
      throw new Error("The card has already attacked.")

    this.turn.card_attacks = {
      zone_idx: zone_idx,
      card: card
    }

    const enemy_key = p_key === "p1" ? "p2" : "p1"
    const enemy_unit_zones = Object.keys(this[enemy_key].zones)
      .filter(idx => {
        return (this[enemy_key].zones[idx] !== null && this[enemy_key].zones[idx] !== undefined)
      })
    this.fireEvent("initiate_attack",
      { p_key: p_key, zone: zone_idx, card: card, enemy_unit_zones: enemy_unit_zones })
    return enemy_unit_zones
  }

  attack(p_key, zone_idx) {
    if (p_key === this.turn.p_key)
      throw new Error(`Cannot attack ${p_key}.`)

    const atk_data = this.turn.card_attacks
    atk_data.p_key = this.turn.p_key
    const card = this[p_key].zones[zone_idx]
    if (!card)
      throw new Error(`No unit to attack on zone ${p_key}.${zone_idx} `)

    atk_data.card = this[atk_data.p_key].zones[atk_data.zone_idx]
    const def_data = {
      p_key: p_key,
      card: card,
      zone_idx: zone_idx
    }

    if (this.turn.has_attacked.includes(atk_data.card.uid))
      throw new Error("The card has already attacked.")

    this.fireEvent("attack", { atk_data: atk_data, def_data: def_data })
    this.turn.has_attacked.push(atk_data.card.uid)
    let battle_data = { atk_data: atk_data, def_data: def_data }
    this.turn.card_attacks = null

    const diff = atk_data.card.atk - def_data.card.atk
    if (diff === 0) {
      battle_data.result = "draw"
      this[atk_data.p_key].zones[atk_data.zone_idx] = null
      this[def_data.p_key].zones[def_data.zone_idx] = null
      this[def_data.p_key].grave.push(def_data.card)
      this[atk_data.p_key].grave.push(atk_data.card)

      this.fireEvent("card_destroyed", def_data)
      this.fireEvent("card_destroyed", atk_data)

      this.fireEvent("grave_updated", {
        p_key: atk_data.p_key,
        added: [atk_data.card]
      })
      this.fireEvent("grave_updated", {
        p_key: def_data.p_key,
        added: [def_data.card]
      })
      this.fireEvent("attack_finished", battle_data)
      return battle_data
    }


    else if (diff < 0) {
      battle_data.result = "win_defender"

      this[atk_data.p_key].lp += diff
      this.fireEvent("lp_updated", {
        p_key: atk_data.p_key,
        diff: diff,
        lp: this[atk_data.p_key].lp
      })

      this.fireEvent("card_destroyed", atk_data)

      this[atk_data.p_key].zones[atk_data.card.zone_idx] = null
      this[atk_data.p_key].grave.push(atk_data.card)
      this.fireEvent("grave_updated", {
        p_key: atk_data.p_key,
        added: [atk_data.card]
      })
      this.fireEvent("attack_finished", battle_data)
      return battle_data
    }
    else {
      battle_data.result = "win_attacker"

      this[def_data.p_key].lp -= diff
      this.fireEvent("lp_updated", {
        p_key: def_data.p_key,
        diff: -diff,
        lp: this[def_data.p_key].lp
      })

      this.fireEvent("card_destroyed", def_data)

      this[def_data.p_key].zones[def_data.zone_idx] = null
      this[def_data.p_key].grave.push(def_data.card)
      this.fireEvent("grave_updated", {
        p_key: def_data.p_key,
        added: [def_data.card]
      })

      this.fireEvent("attack_finished", battle_data)
      return battle_data
    }
  }

  nextTurn() {
    if (this.turn.p_key === "p1") {
      this.turn.p_key = "p2"
    } else if (this.turn.p_key === "p2") {
      this.turn.p_key = "p1"
    } else {
      throw new Error(`Invalid value for turn.p_key ${turn.p_key}`)
    }
    this.turn.placed = false
    this.turn.has_attacked = []
    this.turn.count += 1
    this.fireEvent("turn_change", { p_key: this.turn.p_key, count: this.turn.count })
    this.draw(this.turn.p_key)
  }

  fireEvent(event_key, event_args) {
    const subscribers = this.event_register[event_key]
    if (subscribers === undefined) {
      throw new Error(`Event "${event_key}" does not exist.`)
    }
    subscribers.map(sub => {
      sub(event_args)
    })
    return event_key
  }

  on(event_key, callback) {
    if (!this.event_register[event_key]) {
      throw new Error(`Event "${event_key}" does not exist.`)
    }
    this.event_register[event_key].push(callback)
  }

  enableEventDebugMessages(e) {
    this.on("start",
      e => console.log(`Duel started.`))
    this.on("draw",
      e => console.log(`${e.p_key} drew ${e.cards.length} cards.`))
    this.on("shuffle",
      e => { console.log(`${e.p_key} shuffled.`) })
    this.on("place",
      e => console.log(`${e.card.title} placed on zone ${e.zone}.`))
    this.on("turn_change",
      e => {
        console.log('============================')
        console.log(`Next Turn. ${e.p_key} turn`)
      })
    this.on("initiate_attack",
      e => console.log(`${e.card.title} on zone ${e.p_key} ${e.zone} initates an attack. Enemy units: [${e.enemy_unit_zones.join(',')}]`))
    this.on("attack",
      e => console.log(`${e.atk_data.card.title} attacks ${e.def_data.card.title}`))
    this.on("lp_updated",
      e => console.log(`${e.p_key} LP updated to ${e.lp}. (diff: ${e.diff})`))
    this.on("card_destroyed",
      e => console.log(`${e.card.title} destroyed on zone ${e.p_key}.${e.zone_idx}`))
    this.on("attack_finished", e => {
      if (e.result === "draw")
        console.log("It's a draw.")
      else if (e.result === "win_defender")
        console.log("Defender wins.")
      else if (e.result === "win_attacker")
        console.log("Attacker wins.")
    })

    this.on("grave_updated", e => {
      console.log(`${e.added.map(c => c.title).join(',')} was sent the grave of ${e.p_key}.`)
    })
  }
}

function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

