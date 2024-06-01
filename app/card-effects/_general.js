import Duel from "../duel.js"

export default {
    pop_unit: {
        isAllowed: (duel) => {
            const enemy_key = duel.turn.p_key === "p1" ? "p2" : "p1"
            const units = Object.values(duel.p1.zones).concat(Object.values(duel.p2.zones))
                .filter(z => z !== null && z !== undefined)
            return (units.length > 0)
        },
        execute: (duel, p_key) => {
            if (!duel)
                throw new Error(`duel must not be null.`)

            if (p_key !== "p1" && p_key !== "p2")
                throw new Error("Invalid value for p_key")

            return new Promise((resolve, reject) => {
                duel.requestSelectUnit(duel.turn.p_key)
                    .then(e => {
                        const card = duel[e.p_key].zones[e.zone_idx]
                        if (!card)
                            throw new Error(`No card on field ${e.p_key}.${e.zone_idx}.`)

                        duel.destroy(e.p_key, e.zone_idx)
                        resolve()
                    })
            })
        },
    },
    raise_atk: {
        isAllowed: (duel) => {
            const units = Object.values(duel.p1.zones).concat(Object.values(duel.p2.zones))
                .filter(z => z !== null && z !== undefined)
            return (units.length > 0)
        },
        execute: (duel, p_key, value) => {
            if (!duel)
                throw new Error(`duel must not be null.`)
            if (p_key !== "p1" && p_key !== "p2")
                throw new Error("Invalid value for p_key")

            return new Promise((resolve, reject) => {
                duel.requestSelectUnit(duel.turn.p_key)
                    .then(e => {
                        const target_card = duel[e.p_key].zones[e.zone_idx]
                        if (!target_card)
                            throw new Error(`No card on field ${e.p_key}.${e.zone_idx}.`)
                        target_card.atk += parseInt(value)
                        duel.fireEvent("card_changed", { p_key: e.p_key, zone_idx: e.zone_idx, card: target_card })
                        resolve()
                    })
            })

        }
    },
    ward: {
        isAllowed: (duel) => {
            const units = Object.values(duel.p1.zones).concat(Object.values(duel.p2.zones))
                .filter(z => z !== null && z !== undefined)
            return (units.length > 0)
        },
        execute: (duel, p_key, value) => {
            if (!duel)
                throw new Error(`duel must not be null.`)
            if (p_key !== "p1" && p_key !== "p2")
                throw new Error("Invalid value for p_key")

            return new Promise((resolve, reject) => {
                duel.requestSelectUnit(duel.turn.p_key)
                    .then(e => {
                        const target_card = duel[e.p_key].zones[e.zone_idx]
                        if (!target_card)
                            throw new Error(`No card on field ${e.p_key}.${e.zone_idx}.`)
                        target_card.effs.push("ward")
                        duel.fireEvent("card_changed", { p_key: e.p_key, zone_idx: e.zone_idx, card: target_card })
                        resolve()
                    })
            })

        }

    }
}