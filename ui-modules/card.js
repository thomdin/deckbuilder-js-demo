export default class CardUI {
  
  constructor(data) {
    this.uid = data.uid
    this.main_node = document.createElement("div")
    this.main_node.classList.add("card")
    this.main_node.setAttribute("id", data.uid)
    this.main_node.innerHTML = `
      <header>${data.title}</header>
			<footer>${data.atk}</footer>`
  }

  attachTo(dom_element) {
    dom_element.appendChild(this.main_node)
  }

  openContextMenu(actions) {
    const context_menu = document.createElement("div")
    if(actions.length === 0)
      return
    context_menu.classList.add("context-menu")

    const that = this
    document.addEventListener("click", e => {
      if(e.target === context_menu || context_menu.contains(e.target)) {
        return
      }

      this.closeContextMenu()
    }, true)

    Object.keys(actions)
      .map(key => this.#buildContextMenuButton(key, actions[key]))
      .forEach(btn => context_menu.appendChild(btn))
    this.main_node.appendChild(context_menu)
  }

  closeContextMenu() {
    const context_menu = this.main_node.querySelector('.context-menu')
    if (!context_menu)
      return
    context_menu.remove()
  }

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