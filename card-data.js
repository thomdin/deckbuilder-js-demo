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
		"actions": [{
			"type": "pop_unit"
		}]
	},
	"gs": {
		"title": "Great Sword",
		"type": "action",
		"actions": [{
			"type": "raise_atk",
			"value": 500
		}]
	},
	"sns": {
		"title": "Sword & Shield",
		"type": "action",
		"actions": [{
			"type": "raise_atk",
			"value": 200
		}, {
			"type": "ward",
		}],
	},
	"ward_2x": {
		"title": "Ward 2X",
		"type": "action",
		"actions": [{
			"type": "ward"
		}, {
			"type": "ward"
		}]
	}
}
