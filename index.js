import card_data from './card-data.js'
import Duel from './app/duel.js'
import BoardUI from './ui-modules/board.js'
import CardUI from './ui-modules/card.js'
import MainUIState from './ui-state/main-ui-state.js'
import SelectUnitUIState from './ui-state/select-unit-ui-state.js'
import LockedUIState from './ui-state/locked-ui-state.js'

let deck_1 = [
  "unit_a",
  "unit_a",
  "unit_a",
  "unit_a",
  "unit_a",
  "unit_a",
  "unit_a",
  "unit_a",
  "unit_a",
  "unit_a",
  // "unit_b",
  // "unit_b",
  "gs",
  "gs",
  "sns",
  "sns",
  "ward_2x",
  "ward_2x",
   "one_for_one",
   "one_for_one",
]

let deck_2 = [
  // "unit_a",
  // "unit_a",
  // "unit_a",
  // "unit_a",
  "unit_b",
  "unit_b",
  "unit_b",
  "unit_b",
  "unit_b",
  "unit_b",
  "unit_b",
  "unit_b",
  "unit_b",
  "unit_b",
  "unit_b",
  "unit_b",
  "unit_b",
  // "one_for_one",
  // "gs",
  // "sns",
  // "one_for_one",
  // "gs",
  // "sns"
]

window.duel_api = new Duel(
  card_data,
  deck_1,
  deck_2,
  "p1"
);
duel_api.enableEventDebugMessages()

const board_ui = new BoardUI(duel_api)
board_ui.attachTo(document.getElementById('app'))

duel_api.on("draw", e => {
  const card_ui_list = e.cards
    .map((card => new CardUI(card)))
  board_ui.draw(e.p_key, card_ui_list)
})

duel_api.on("place", e => {
  board_ui.placeFromHand(e.p_key, e.card.uid, e.zone)
})
duel_api.on("place_action", e => {
  board_ui.placeFromHand(e.p_key, e.card.uid, e.zone)
})


duel_api.on("card_destroyed", e => {
  board_ui.destroyCard(e.card)
})

duel_api.on("grave_updated", e => {
  board_ui.updateGrave(e.p_key, e.added.map(card => new CardUI(card)))
})

duel_api.on("lp_updated", e => {
  board_ui.updateLP(e.p_key, e.diff, e.lp)
  board_ui.nodes[e.p_key].lp.innerText = e.lp
})

duel_api.on("action_resolved", e => {
  board_ui.nextUIState(new MainUIState(board_ui, duel_api))
  board_ui.nodes[e.p_key].action.innerHTML = ''
})

duel_api.on("request_select_unit", e => {
  board_ui.nextUIState(new SelectUnitUIState(board_ui, duel_api, (p_key, zone_idx) => {
    duel_api.selectUnit(p_key, zone_idx)
  }, e))
})

board_ui.updateLP("p1", 0, 4000)
board_ui.updateLP("p2", 0, 4000)

duel_api.on("turn_change", e => {
  if (e.p_key === "p1") {
    return
  }

  // dumb ai, place greatest atk, attack greatest atk
  const delay = 1000
  duel_api.p2.hand.sort((a, b) => a.atk < b.atk)
  setTimeout(() => {
    duel_api.placeCardFromHand("p2", duel_api.p2.hand[0].uid)
  }, delay)

  setTimeout(() => {
    const p1_used = Object.keys(duel_api.p1.zones)
      .filter(i => duel_api.p1.zones[i] !== null)
      .map(i => {
        return { card: duel_api.p1.zones[i], "zone_idx": i, p_key: "p1" }
      })
      .sort((a, b) => a.card.atk > b.card.atk)

    if (p1_used.length === 0) {
      duel_api.nextTurn()
      return
    }

    const def_data = p1_used.pop()
    const p2_better = Object.keys(duel_api.p2.zones)
      .filter(i => {
        const atk_card = duel_api.p2.zones[i]
        if (atk_card === null)
          return false
        return atk_card.atk >= def_data.card.atk
      })
      .map(i => {
        return { card: duel_api.p2.zones[i], zone_idx: i, p_key: "p2" }
      })
      .sort((a, b) => a.card.atk < b.card.atk)

    if (p2_better.length === 0) {
      duel_api.nextTurn()
      return
    }

    const atk_data = p2_better[0]
    duel_api.initiateAttack("p2", atk_data.zone_idx)
    duel_api.attack("p1", def_data.zone_idx)
    duel_api.nextTurn()
  }, delay * 2);
})

duel_api.on("finished", () => {
  board_ui.nextUIState(new LockedUIState())
})
duel_api.start()
board_ui.nextUIState(new MainUIState(board_ui, duel_api))