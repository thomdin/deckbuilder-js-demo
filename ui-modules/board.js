import LockedUIState from '../ui-state/locked-ui-state.js'
import MainUIState from '../ui-state/main-ui-state.js'
import CardUI from './card.js'
export default class BoardUI {

  /**
   * 
   * @param {Duel} duel 
   */
  constructor(duel) {
    this.duel = duel
    this.main_node = document.createElement("div")
    this.attacker_card_ui = null
    this.ui_state = null
    this.ui_action = {
      current: "default",
      options: {
        default: "default", selectAttackTarget: "selectAttackTarget"
      }
    }
    this.ui_elem = {
      p1: {
        hand: {},
        zones: { 0: null, 1: null, 2: null },
        action: null
      },
      p2: {
        hand: {},
        zones: { 0: null, 1: null, 2: null },
        action: null
      }
    },
      this.main_node.innerHTML = `
			<div class="duel-container">
				<div class="board" id="board">
					<div class="hand" id="hand-p2"></div>
					<div class="row">
						<div class="grave" id="grave-p2"></div>
            <div id="action-zone-p2" class="zone action-zone"></div>
						<div class="field" id="field-p2">
							<div><div class="zone" id="zone-p2-2" data-index="2"></div></div>
							<div><div class="zone" id="zone-p2-1" data-index="1"></div></div>
							<div><div class="zone" id="zone-p2-0" data-index="0"></div></div>
						</div>
						<div class="spacer">
							<p>P2</p>
							<p>LP: <span id="lp-p2"></span></p>
						</div>
					</div>
					<div class="row" style="margin-top: 15px">
						<div class="spacer">
							<p>P1</p>
							<p>LP: <span id="lp-p1"></span></p>
						</div>
						<div class="field" id="field-p1">
							<div><div class="zone" id="zone-p1-0" data-index="0"></div></div>
							<div><div class="zone" id="zone-p1-1" data-index="1"></div></div>
							<div><div class="zone" id="zone-p1-2" data-index="2"></div></div>
						</div>
            <div id="action-zone-p1" class="zone action-zone"></div>
						<div class="grave" id="grave-p1"></div>
					</div>
					<div class="hand" id="hand-p1"></div>
				</div>
				<footer style="text-align:right">
					<button class="btn" id="end-turn">End turn</button>
				</footer>
			</div>
      <div id="win-message">
        <div>
          <header>
            <span id="winning-player"></span> wins
          </header>
          <button onclick="location.reload()">Restart</button>
        </div>
      </div>
			`
  }

  /**
   * 
   * @param {HTMLElement} dom_element 
   */
  attachTo(dom_element) {
    dom_element.appendChild(this.main_node)
    this.nodes = {
      p1: {
        hand: document.getElementById('hand-p1'),
        field: document.getElementById('field-p1'),
        zones: {
          0: document.getElementById('zone-p1-0'),
          1: document.getElementById('zone-p1-1'),
          2: document.getElementById('zone-p1-2'),
        },
        action: document.getElementById('action-zone-p1'),
        grave: document.getElementById('grave-p1'),
        lp: document.getElementById('lp-p1')
      },
      p2: {
        hand: document.getElementById('hand-p2'),
        field: document.getElementById('field-p2'),
        zones: {
          0: document.getElementById('zone-p2-0'),
          1: document.getElementById('zone-p2-1'),
          2: document.getElementById('zone-p2-2'),
        },
        action: document.getElementById('action-zone-p2'),
        grave: document.getElementById('grave-p2'),
        lp: document.getElementById('lp-p2'),
      },
      message: document.getElementById('win-message'),
      btn_end_turn: document.getElementById('end-turn')
    }

    // handle click on board
    document.addEventListener("mouseup", e => {
      this.ui_state.clickAny(e)
    })

    // handle click in hand
    this.nodes.p1.hand.addEventListener("click", e => {
      this.ui_state.clickHand(e)
    })

    // handle click on p1 field zone
    Object.keys(this.nodes.p1.zones).forEach(zone_idx => {
      const zone = this.nodes.p1.zones[zone_idx]
      zone.addEventListener('click', e => {
        this.ui_state.clickUnitZone(e, zone_idx)
      })
    })

    // handle click on p2 field zone
    Object.keys(this.nodes.p2.zones).forEach(zone_idx => {
      const zone = this.nodes.p2.zones[zone_idx]
      zone.addEventListener('click', e => {
        this.ui_state.clickOpponentZone(e, zone_idx)
      })
    })

    this.nodes.btn_end_turn.addEventListener('click', () => {
      duel_api.nextTurn()
    })

    this.duel.on("turn_change", e => {
      if (e.p_key === "p2") {
        this.nextUIState(new LockedUIState())
      }
      else if (e.p_key === "p1") {
        this.nextUIState(new MainUIState(this, this.duel))
      }
      else {
        throw new Error(`Unkown p_key ${p_key}.`)
      }
    })

    this.duel.on("card_changed", e => {
      const card_ui = new CardUI(e.card)
      this.ui_elem[e.p_key].zones[e.zone_idx] = card_ui
      this.nodes[e.p_key].zones[e.zone_idx].innerHTML = ''
      this.nodes[e.p_key].zones[e.zone_idx].appendChild(card_ui.main_node)
    })

    this.duel.on("finished", e => {
      document.getElementById('winning-player').innerText = e.winner
      this.nodes.message.style.display = "flex"
    })
  }

  /**
   * 
   * @param {string} p_key 
   * @param {Array<CardUI>} card_ui 
   */
  draw(p_key, card_ui_list) {
    card_ui_list.forEach(card_ui => {
      this.ui_elem[p_key].hand[card_ui.uid] = card_ui
      const wrap = document.createElement("div")
      wrap.appendChild(card_ui.main_node)
      this.nodes[p_key].hand.appendChild(wrap)
    })

    if (p_key === "p1") {
      this.nextUIState(new MainUIState(this, this.duel))
    }
  }

  /**
   * 
   * @param {string} p_key 
   * @param {string} card_uid 
   * @param {number} zone_idx 
   */
  placeFromHand(p_key, card_uid, zone_idx) {
    const card_ui = this.ui_elem[p_key].hand[card_uid]
    if (!card_ui)
      throw new Error("Card is not in hand")

    const node = document.getElementById(card_uid)
    const parent = node.parentNode
    if (card_ui.card.type === "action") {
      this.nodes[p_key].action.appendChild(node)
      parent.remove()
      this.ui_elem[p_key].action = card_ui
    }
    else {
      this.nodes[p_key].zones[zone_idx].appendChild(node)
      parent.remove()
      this.ui_elem[p_key].zones[zone_idx] = card_ui
    }
  }

  /**
   * 
   * @param {card} card 
   */
  destroyCard(card) {
    const card_node = document.getElementById(card.uid)
    card_node.remove()
  }

  /**
   * 
   * @param {string} p_key 
   * @param {CardUI[]} added 
   */
  updateGrave(p_key, added) {
    const grave = this.nodes[p_key].grave
    added.forEach(card_ui => {
      grave.appendChild(card_ui.main_node)
    })
  }

  /**
   * 
   * @param {string} p_key 
   * @param {number} diff 
   * @param {number} lp 
   */
  updateLP(p_key, diff, lp) {
    this.nodes[p_key].lp.innerText = lp
  }

  nextUIState(state) {
    if (!state)
      throw new Error("state must not be null.")
    this.ui_state = state
    console.log(`switched state ${state.constructor.name}`)
    const actions = this.duel.allowedActions()
    this.highlightAllowedActions(actions)
  }

  highlightAllowedActions(actions) {
    document.querySelectorAll('.highlight').forEach(node => node.classList.remove('highlight'))
    if (this.ui_state instanceof LockedUIState) {
      return
    }
    actions.p1.hand
      .concat(actions.p1.field)
      .concat(actions.p2.field)
      .forEach(([action, card]) => {
        const node = document.getElementById(card.uid)
        if (!node)
          throw new Error(`Node for card ${card.title}:${card.uid} does not exist.`)
        node.classList.add("highlight")
      })
  }
}
