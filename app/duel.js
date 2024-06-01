import CardEffects from "./card-effects/_general.js"
import MainState from "./state/main-state.js"
import SelectUnitState from "./state/select-unit-state.js"

/**
 * Duel logic, detached from the UI
 */
export default class Duel {
  /**
   * 
   * @param {Card[]} card_list 
   * @param {string[]} deck_p1 
   * @param {string[]} deck_p2 
   * @param {string} starter 
   */
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
        card.effs = card.effs ? card.effs : []
        card.uid = `p1-${i}`
        return card
      }),
      grave: [],
      hand: [],
      zones: { 0: null, 1: null, 2: null },
      action: null,
      lp: 4000
    }

    this.p2 = {
      deck: deck_p2.map((c, i) => {
        const card = structuredClone(card_list[c])
        card.effs = card.effs ? card.effs : []
        card.uid = `p2-${i}`
        return card
      }),
      grave: [],
      hand: [],
      zones: { 0: null, 1: null, 2: null },
      action: null,
      lp: 4000
    }

    this.turn_data = {
      turn: this.turn,
      p1: this.p1,
      p2: this.p2
    }

    this.event_register = {
      shuffle: [],
      place: [],
      place_action: [],
      action_resolved: [],
      draw: [],
      start: [],
      initiate_attack: [],
      attack: [],
      lp_updated: [],
      card_destroyed: [],
      grave_updated: [],
      attack_finished: [],
      turn_change: [],
      finished: [],
      select_unit: [],
      request_select_unit: [],
      card_changed: []
    }

    this.state = new MainState(this)
  }

  /**
   * @returns void
   */
  start() {
    this.shuffleDeck("p1")
    this.shuffleDeck("p2")

    this.fireEvent("start")

    this.draw("p1", 3, true)
    this.draw("p2", 3, true)
  }

  /**
   * 
   * @param {string} p_key 
   */
  shuffleDeck(p_key) {
    if (!this[p_key].deck)
      throw new Error("Invalid p_key.")
    this.#shuffleArray(this[p_key].deck)
    this.fireEvent("shuffle", { p_key: p_key })
  }

  /**
   * 
   * @param {string} p_key 
   * @param {number} amount 
   * @param {boolean} ignoreTurn 
   * @returns void
   */
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

  /**
   * 
   * @param {string} p_key 
   */
  isTurn(p_key) {
    if (p_key !== "p1" && p_key !== "p2")
      throw new Error(`Invalid value for p_key ${p_key}. Allowed: p1, p2`)
    return this.turn.p_key === p_key
  }

  /**
   * 
   * @param {string} p_key 
   * @param {string} uid 
   * @returns void
   */
  placeCardFromHand(p_key, uid) {
    if (this.turn.placed) {
      throw new Error(`${p_key} cannot place: Already placed this turn.`)
    }
    if (p_key !== this.turn.p_key) {
      throw new Error(`${p_key} cannot place: Not your turn.`)
    }
    const card = this[p_key].hand.filter(c => c.uid == uid).pop()
    if (!card)
      throw new Error(`The card of uid ${uid} is not in the hand of player ${p_key}.`)

    if (card.type !== "unit")
      throw new Error(`Can only place unit cards. Given card type: ${card.type}`)

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
  }

  /**
   * 
   * @param {string} p_key 
   * @param {number} zone_idx 
   */
  initiateAttack(p_key, zone_idx) {
    if (p_key !== this.turn.p_key)
      throw new Error(`${p_key} cannot attack: Not your turn.`)
    const card = this[p_key].zones[zone_idx]
    if (!card)
      throw new Error(`There is no card in the zone ${zone_idx} of ${p_key}.`)

    if (this.turn.has_attacked.includes(card.uid))
      throw new Error("The card has already attacked.")

    if (this.turn.count === 0)
      throw new Error("Not allowed to attack in turn 0")

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

    if (enemy_unit_zones.length === 0) {
      this.#directAttack()
      return
    }

    this.state = new SelectUnitState(this, { field: "p2" })
  }

  #directAttack() {
    const p_key = this.turn.p_key === "p1" ? "p2" : "p1"
    this.#alterLp(p_key, this.turn.card_attacks.card.atk)
    this.turn.has_attacked.push(this.turn.card_attacks.card.uid)
    this.turn.card_attacks = null
  }

  /**
   * 
   * @param {string} p_key 
   * @param {number} zone_idx 
   * @returns 
   */
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

    if (def_data.card.effs.includes("ward")) {
      const i = def_data.card.effs.indexOf("ward")
      def_data.card.effs.splice(i, 1)
      this.fireEvent("card_changed", { p_key: def_data.p_key, zone_idx: def_data.zone_idx, card: def_data.card })
      battle_data.result = "ward_destroyed"
      this.fireEvent("attack_finished", battle_data)
      this.state = new MainState(this)
      return battle_data

    }


    const diff = atk_data.card.atk - def_data.card.atk
    if (diff === 0) {
      battle_data.result = "draw"
      this.destroy(atk_data.p_key, atk_data.zone_idx)
      this.destroy(def_data.p_key, def_data.zone_idx)
      this.fireEvent("attack_finished", battle_data)
      this.state = new MainState(this)
      return battle_data
    }


    else if (diff < 0) {
      battle_data.result = "win_defender"

      this.#alterLp(atk_data.p_key, diff)
      this.destroy(atk_data.p_key, atk_data.zone_idx)
      this.fireEvent("attack_finished", battle_data)
      this.state = new MainState(this)
      return battle_data
    }
    else {
      battle_data.result = "win_attacker"

      this.#alterLp(def_data.p_key, diff)
      this.destroy(def_data.p_key, def_data.zone_idx)
      this.fireEvent("attack_finished", battle_data)
      this.state = new MainState(this)
      return battle_data
    }
  }


  /**
   * 
   * @param {string} p_key 
   * @param {number} zone_idx
   */
  destroy(p_key, zone_idx) {
    const card = this[p_key].zones[zone_idx]
    if (!card)
      throw new Error(`No card on field ${p_key}.${zone_idx}.`)


    this[p_key].zones[zone_idx] = null
    this[p_key].grave.push(card)
    this.fireEvent("card_destroyed", { p_key: p_key, zone_idx: zone_idx, card: card })
    this.fireEvent("grave_updated", {
      p_key: p_key,
      added: [card]
    })
  }

  playAction(p_key, card) {
    if (p_key !== "p1" && p_key !== "p2")
      throw new Error("Invalid p_key")
    if (card.type !== "action")
      throw new Error(`Can only play cards of type action. Given type: ${card.type}`)

    this[p_key].hand = this[p_key].hand.filter(c => c.uid !== card.uid)
    this[p_key].action = card;
    this.fireEvent("place_action", { p_key: p_key, card: card })

    let resolved_actions = 0
    card.actions.forEach(action => {
      if (!(action.type in CardEffects))
        throw new Error(`Unknown action ${action.type}`)

      const action_obj = CardEffects[action.type]
      if (!action_obj.isAllowed(this))
        throw new Error(`Action ${action.type} is not allowed.`)

      action_obj.execute(this, p_key, action.value)
        .then(() => {
          resolved_actions++
          if (resolved_actions < card.actions.length)
            return

          this.fireEvent("action_resolved", { p_key: p_key, card: card })
          this.action = null
          this[p_key].grave.push(card)
          this.fireEvent("grave_updated", {
            p_key: p_key,
            added: [card]
          })
        })
    })
  }

  /**
   * @returns void
   */
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

  printState() {
    console.log(this.state)
  }

  loadState(state) {
    if (!state) throw new Error("State must not be null.")
    if (!state.p1) throw new Error("State p1 must not be null.")
    if (!state.p2) throw new Error("State p2 must not be null.")
    if (!state.turn) throw new Error("State turn must not be null.")
    this.p1 = structuredClone(state.p1)
    this.p2 = structuredClone(state.p2)
    this.turn = structuredClone(state.turn)
  }

  requestSelectUnit(p_requestfrom, field) {
    this.state = new SelectUnitState(this, { p_requestfrom: p_requestfrom, field: field })
    this.fireEvent("request_select_unit", { p_requestfrom: p_requestfrom, field: field })
    return new Promise((resolve, reject) => {
      this.on("select_unit", (e) => {
        resolve(e);
      })
    })
  }


  /**
   * 
   * @param {string}} p_key 
   * @param {number} zone_idx 
   */
  selectUnit(p_key, zone_idx) {
    this.state.selectUnit(p_key, zone_idx)
  }

  /**
   * 
   * @param {string} event_key 
   * @param {any} event_args 
   * @returns void
   */
  fireEvent(event_key, event_args) {
    const subscribers = this.event_register[event_key]
    if (subscribers === undefined) {
      throw new Error(`Event "${event_key}" does not exist.`)
    }
    subscribers.map(sub => {
      sub(event_args)
    })
  }

  /**
   * 
   * @param {string} event_key 
   * @param {function} callback 
   */
  on(event_key, callback, identifier = null) {
    if (!this.event_register[event_key]) {
      throw new Error(`Event "${event_key}" does not exist.`)
    }

    if (identifier)
      this.event_register[event_key][identifier] = callback
    else
      this.event_register[event_key].push(callback)
  }

  offEvent(event_key, callback) {
    if (!event_key in this.event_register)
      throw new Error(`Event "${event_key}" does not exist.`)
    if (!callback in this.event_register[event_key])
      throw new Error(`Listener ${callback} for event "${event_key}" does not exist.`)

    const array = this.event_register[event_key]
    const index = array.indexOf(5);
    if (index > -1) { // only splice array when item is found
      array.splice(index, 1); // 2nd parameter means remove one item only
    }
  }

  allowedActions() {
    return this.state.allowedActions(this)
  }

  /**
   * @returns void
   */
  enableEventDebugMessages() {
    this.on("start",
      e => console.log(`Duel started.`))
    this.on("draw",
      e => console.log(`${e.p_key} drew ${e.cards.length} cards.`))
    this.on("shuffle",
      e => { console.log(`${e.p_key} shuffled.`) })
    this.on("place",
      e => console.log(`${e.card.title} placed on zone ${e.zone}.`))
    this.on("place_action",
      e => console.log(`${e.p_key} placed action card ${e.card.title}`))
    this.on("action_resolved",
      e => console.log(`${e.p_key} resolved action ${e.card.title}.`))
    this.on("turn_change",
      e => {
        console.log('============================')
        console.log(`Next Turn. ${e.p_key} turn`)
      })
    this.on("initiate_attack",
      e => console.log(`${e.card.title} on zone ${e.p_key} ${e.zone} initates an attack. Enemy units: [${e.enemy_unit_zones.join(',')}]`))
    this.on("request_select_unit",
      e => console.log(`${e.p_requestfrom} has to select a unit. Field restriction: ${e.field ? e.field : 'none'}`))
    this.on("attack",
      e => console.log(`${e.atk_data.card.title} attacks ${e.def_data.card.title}`))
    this.on("lp_updated",
      e => console.log(`${e.p_key} LP updated to ${e.lp}. (diff: ${e.diff})`))
    this.on("card_destroyed",
      e => console.log(`${e.card.title} destroyed on zone ${e.p_key}.${e.zone_idx}`))
    this.on("select_unit",
      e => console.log(`${e.card.title} selected on zone ${e.p_key}.${e.zone_idx}`))
    this.on("attack_finished", e => {
      if (e.result === "draw")
        console.log("It's a draw.")
      else if (e.result === "win_defender")
        console.log("Defender wins.")
      else if (e.result === "win_attacker")
        console.log("Attacker wins.")
      else if (e.result === "ward_destroyed")
        console.log("Ward was destroyed")
    })

    this.on("grave_updated", e => {
      console.log(`${e.added.map(c => c.title).join(',')} was sent the grave of ${e.p_key}.`)
    })

    this.on("card_changed",
      e => console.log(`Card changed ${JSON.stringify(e)}`))

    this.on("finished",
      e => console.log(`${e.winner} is the winner.`))
  }

  /**
   * 
   * @param {string} p_key 
   * @param {number} diff 
   */
  #alterLp(p_key, diff) {
    this[p_key].lp -= diff

    if (this[p_key].lp <= 0) {
      this[p_key].lp = 0
      this.fireEvent("lp_updated", {
        p_key: p_key,
        diff: diff,
        lp: this[p_key].lp
      })
      this.fireEvent("finished", { winner: p_key === "p1" ? "p2" : "p1" })
      return
    }

    this.fireEvent("lp_updated", {
      p_key: p_key,
      diff: diff,
      lp: this[p_key].lp
    })
  }

  #shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }
}

