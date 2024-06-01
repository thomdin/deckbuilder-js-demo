import MainUIState from "./main-ui-state.js"

export default class SelectUnitUIState {
    constructor(board_ui, duel, callback, restrictions) {
        this.restrictions = restrictions
        this.board_ui = board_ui
        this.duel = duel
        this.callback = callback
        if (!callback)
            throw new Error("A callback must be defined.")

        this.allowedActions = this.duel.allowedActions()
    }

    clickAny(e) {
        return
    }

    clickUnitZone(e, zone_idx) {
        if (this.allowedActions.p1.field.length === 0)
            return
        this.#selectUnit(e, "p1", zone_idx)
    }

    clickOpponentZone(e, zone_idx) {
        if (this.allowedActions.p2.field.length === 0)
            return
        this.#selectUnit(e, "p2", zone_idx)
    }

    clickActionZone(e) {
        return
    }

    clickHand(e) {
        return
    }

    #selectUnit(e, p_key, zone_idx) {
        const zone_node = e.target.closest('.zone')
        if (!zone_node)
            return
        const card = this.duel[p_key].zones[zone_idx]

        if (!card)
            return

        const card_node = zone_node.querySelector('.card');
        if (!card_node)
            throw new Error("Card exists in duel but not as HTMLElement.")

        const card_ui = this.board_ui.ui_elem[p_key].zones[zone_idx]
        if (!card_ui)
            throw new Error("Card exists in duel but not as UI Element.")

        this.callback(p_key, zone_idx, card_ui)
    }
}