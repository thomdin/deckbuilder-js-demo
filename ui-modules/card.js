export default class CardUI {

  /**
   * @constructor
   * @param {*} data 
   */
  constructor(data) {
    this.uid = data.uid
    this.card = data
    this.main_node = document.createElement("div")
    this.main_node.classList.add("card")
    this.main_node.setAttribute("id", data.uid)
    this.event_register = {
      'context_close': []
    }
    if (data.type === "action") {
      this.main_node.innerHTML = `
      <header>${data.title}</header>
      <div></div>`
    } else if (data.type === "unit") {
      this.main_node.innerHTML = `
      <header>${data.title}</header>
      <div>${data.effs ? data.effs.join(', ') : ''}</div>
      <footer>${data.atk}</footer>`
    }
    else {
      throw new Error(`Unknown card type: ${data.type}`)
    }

  }

  /**
   * 
   * @param {HTMLElement} dom_element 
   */
  attachTo(dom_element) {
    dom_element.appendChild(this.main_node)
  }


  /**
   * 
   * @param {Array} actions 
   * @returns 
   */
  openContextMenu(actions) {
    if (!actions === null || actions === undefined)
      throw new Error("actions must not be null.")

    const context_menu = document.createElement("div")
    if (actions.length === 0)
      return
    context_menu.classList.add("context-menu")

    Object.keys(actions)
      .map(key => this.#buildContextMenuButton(key, actions[key]))
      .forEach(btn => context_menu.appendChild(btn))
    this.main_node.appendChild(context_menu)
  }

  /**
   * 
   * @returns void
   */
  closeContextMenu() {
    const context_menu = this.main_node.querySelector('.context-menu')
    if (!context_menu)
      return
    context_menu.remove()
    this.event_register['context_close'].forEach(callback => callback())
  }

  onContextMenuClose(callback) {
    this.event_register['context_close'].push(callback)
  }

  /**
   * 
   * @param {string} name 
   * @param {void} callback 
   * @returns HTMLElement
   */
  #buildContextMenuButton(name, callback) {
    const btn = document.createElement("button")
    btn.classList.add(name)
    btn.innerText = name
    btn.addEventListener("click", () => {
      callback()
      this.closeContextMenu()
    })
    return btn
  }
} 