export default class ContextMenuUIState {
    constructor(board_ui, duel, cancelToState, card_ui) {
        this.board_ui = board_ui
        this.duel = duel
        this.card_ui = card_ui
        this.cancelToState = cancelToState
    }

    clickAny(e) {
        const context_menu = this.card_ui.main_node.querySelector('.context-menu')
        if (!context_menu)
            return
        if (e.target === context_menu || context_menu.contains(e.target)) {
            return
        }

        this.card_ui.closeContextMenu()
        this.board_ui.nextUIState(this.cancelToState)
    }

    clickUnitZone(e, zone_idx) {
        return
    }

    clickActionZone(e, zone_idx) {
        return
    }

    clickOpponentZone(e, zone_idx) {
        return
    }

    clickHand(e, zone_idx) {
        return
    }
}