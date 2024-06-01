import CardEffects from "../card-effects/_general.js"

export default class MainState {
    constructor(duel) {
        this.duel = duel
    }

    allowedActions() {
        const p_key = this.duel.turn.p_key
        const allowed = {
            p1: {
                hand: [],
                field: []
            },
            p2: {
                hand: [],
                field: []
            }
        }

        // hand
        let can_place = !this.duel.turn.placed
        if (can_place) {
            // check for empty zones 
            const empty_zones = Object.values(this.duel[this.duel.turn.p_key].zones).filter(z => z === null || z === undefined)
            can_place = empty_zones.length > 0
        }
        this.duel[p_key].hand.forEach(card => {
            if (card.type === "unit") {
                if (!can_place)
                    return
                allowed[p_key].hand.push(["place", card])
            } else if (card.type === "action") {
                const has_unallowed = card.actions.some(action => !CardEffects[action.type].isAllowed(this.duel))
                if (has_unallowed)
                    return
                allowed[p_key].hand.push(["activate", card])
            }
            else {
                throw new Error("Unknown type for card. " + card.type)
            }
        })

        // field
        if (this.duel.turn.count === 0)
            return allowed
        
        Object.values(this.duel[p_key].zones).forEach(card => {
            if (!card)
                return
            if (this.duel.turn.has_attacked.includes(card.uid))
                return
            allowed[p_key].field.push(['attack', card])
        })

        return allowed
    }
}