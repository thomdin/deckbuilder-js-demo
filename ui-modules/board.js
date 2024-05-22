export default class BoardUI {

  constructor(duel) {
    this.duel = duel
    this.main_node = document.createElement("div")
    this.attacker_card_ui = null
    this.ui_action = {
      current: "default",
      options: {
        default: "default", selectAttackTarget: "selectAttackTarget"
      }
    }
    this.ui_elem = {
      p1: {
        hand: {},
        zones: { 0: null, 1: null, 2: null }
      },
      p2: {
        hand: {},
        zones: { 0: null, 1: null, 2: null }
      }
    },
      this.main_node.innerHTML = `
			<div class="duel-container">
				<div class="board" id="board">
					<div class="hand" id="hand-p2"></div>
					<div class="row">
						<div class="grave" id="grave-p2"></div>
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
						<div class="grave" id="grave-p1"></div>
					</div>
					<div class="hand" id="hand-p1"></div>
				</div>
				<footer style="text-align:right">
					<button class="btn" id="end-turn">End turn</button>
				</footer>
			</div>
			`
  }

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
        grave: document.getElementById('grave-p2'),
        lp: document.getElementById('lp-p2'),
      },
      btn_end_turn: document.getElementById('end-turn')
    }

    // handle click in hand
    this.nodes.p1.hand.addEventListener("click", e => {
      if (this.duel.turn.p_key !== "p1")
        return
      if (this.duel.turn.placed)
        return
      const card = e.target.closest(".card")
      if (!card)
        return

      const card_ui = this.ui_elem.p1.hand[card.id]
      if (!card_ui)
        throw new Error("Card UI Element is not in hand.")
      card_ui.openContextMenu({
        place: () => {
          const zone_idx = duel_api.placeCardFromHand("p1", card_ui.uid)
        }
      })
    })

    // handle click on p1 field zone
    Object.keys(this.nodes.p1.zones).forEach(zone_idx => {
      const zone = this.nodes.p1.zones[zone_idx]
      zone.addEventListener('click', e => {
        const card_node = zone.querySelector('.card')
        if (!card_node)
          return
        if (this.duel.turn.p_key !== "p1")
          return
        if (this.duel.turn.has_attacked.includes(card_node.uid))
          return

        const card_ui = this.ui_elem.p1.zones[zone_idx]
        card_ui.openContextMenu({
          initiateAttack: () => {
            this.ui_action.current = this.ui_action.options.selectAttackTarget
            this.duel.initiateAttack("p1", zone_idx)
          }
        })
      })
    })

    // handle click on p2 field zone
    Object.keys(this.nodes.p2.zones).forEach(zone_idx => {
      const zone = this.nodes.p2.zones[zone_idx]
      zone.addEventListener('click', e => {
        if (this.ui_action.current !== this.ui_action.options.selectAttackTarget)
          return
        if (this.duel.p2.zones[zone_idx] === null || this.duel.p2.zones[zone_idx] === undefined)
          return
        this.duel.attack("p2", zone_idx)
        this.ui_action.current = this.ui_action.options.default
      })
    })
  }

  addToHand(p_key, card_ui) {
    this.ui_elem[p_key].hand[card_ui.uid] = card_ui

    const wrap = document.createElement("div")
    wrap.appendChild(card_ui.main_node)
    this.nodes[p_key].hand.appendChild(wrap)
  }

  placeFromHand(p_key, card_uid, zone_idx) {
    const card_ui = this.ui_elem[p_key].hand[card_uid]
    if (!card_ui) throw new Error("Card is not in hand")
    const node = document.getElementById(card_uid)
    const parent = node.parentNode
    this.nodes[p_key].zones[zone_idx].appendChild(node)
    parent.remove()

    this.ui_elem[p_key].zones[zone_idx] = card_ui
  }

  destroyCard(card) {
    const card_node = document.getElementById(card.uid)
    card_node.remove()
  }

  updateGrave(p_key, added) {
    const grave = this.nodes[p_key].grave
    added.forEach(card_ui => {
      grave.appendChild(card_ui.main_node)
    })
  }

  updateLP(p_key, diff, lp) {
    this.nodes[p_key].lp.innerText = lp
  }
}
