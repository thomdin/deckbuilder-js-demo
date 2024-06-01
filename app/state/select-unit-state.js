import MainState from "./main-state.js"

export default class SelectUnitState {
    constructor(duel, restrictions) {
        this.duel = duel
        this.restrictions = restrictions
    }

    allowedActions() {
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

        let fields = ["p1", "p2"]
        if (this.restrictions.field) {
            if (this.restrictions.field !== "p1" && this.restrictions.field !== "p2")
                throw new Error("field must be p1 or p2.")
            fields = [this.restrictions.field]
        }

        fields.forEach(p_key => {
            Object.values(this.duel[p_key].zones).forEach(card => {
                if (!card)
                    return
                allowed[p_key].field.push(['select', card])
            })
        })

        return allowed
    }

    selectUnit(p_key, zone_idx) {
        if (p_key !== "p1" && p_key !== "p2")
            throw new Error("Invalid value for p_key")

        const card = this.duel[p_key].zones[zone_idx]
        if (!card)
            throw new Error(`No unit on zone ${p_key}.${zone_idx}`)
        this.duel.fireEvent("select_unit", { p_key: p_key, zone_idx: zone_idx, card: card })
        this.duel.state = new MainState(this.duel)
    }
}