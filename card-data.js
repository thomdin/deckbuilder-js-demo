export default {
	"unit_a": {
		"title": "Unit A",
		"type": "unit",
		"atk": 1500,
		"def": 1000
	},
	"unit_b": {
		"title": "Unit B",
		"type": "unit",
		"atk": 1300,
		"def": 2000
	},
	"one_for_one": {
		"title": "One for One",
		"type": "action",
		"action": {
			"action_type": "pop_unit"
		}
	},
	"gs": {
		"title": "Great Sword",
		"card_type": "equip",
		"action": {
			"type": "raise_atk_by",
			"value": 500
		}
	},
	"sns": {
		"title": "Sword & Shield",
		"card_type": "equip",
		"actions": [{
			"type": "raise_atk_by",
			"value": 200
		}, {
			"type": "raise_def_by",
			"value": 600
		}]
	}
}
