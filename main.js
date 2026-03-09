const chat_div = document.getElementById("chat_div")
const input_field = document.getElementById("input_text")
const btn_send = document.getElementById("btn_send")
const save_chat = document.getElementById("save_chat")
const new_chat = document.getElementById("new_chat")
const chat_history = document.getElementById("chat_history")
const delete_chat = document.getElementById("delete_chat")

let chat_state = []

document.addEventListener("DOMContentLoaded", async() => {
    await load_chat_history()
    await handleSendActions()
    new_chat_handler()
})

async function load_chat_history() {
    const api_call = await fetch('https://reflexshop.app.n8n.cloud/webhook/api/get-chat-history', {
        method: 'GET',
        headers: {"Content-Type": "application/json"}
    })

    const response = await api_call.json().catch((err) => {chat_history.innerHTMl = err})

    const p_tag = document.createElement("p")
    p_tag.innerHTML = "Chat history"
    p_tag.style.color = 'white'
    chat_history.appendChild(p_tag)

    response?.forEach((element) => {
        const chat_history_btn = document.createElement("button")
        chat_history_btn.className = "chat_history_btn"
        chat_history_btn.id = element.id
        chat_history_btn.addEventListener("click", async() => {
            await get_chat(element.id)
        })
        chat_history_btn.innerHTML = element.title

        chat_history.appendChild(chat_history_btn)
    })
}

async function get_chat(id) {
    const api_call = await fetch("https://reflexshop.app.n8n.cloud/webhook/api/get-chat", {
        method: 'GET',
        headers: {"Content-Type": "application/json", "id": id},
    }).catch((err) => {console.error(err)})

    const response = await api_call.json().catch((err) => {console.error(err)})

    document.querySelector('main').innerHTML = response.html_state
    chat_state = response.ai_state
}

async function callAPI() {
    let counter = 1;
    const user_input = input_field.value

    input_field.value = ''

    const user_text = document.createElement('p')
    user_text.id = 'user_input'
    user_text.innerText = user_input
    chat_div.appendChild(user_text)

    const loading_text = document.createElement('p')
    loading_text.id = 'loading_text'

    const count_seconds = setInterval(() => {
        document.getElementById('loading_text').innerHTML = `Waiting for response ${counter++}s.`
    }, 1_000)

    chat_div.appendChild(loading_text)

    changeTitle("Waiting for response...")
    const api = await fetch("https://reflexshop.app.n8n.cloud/webhook/api/chat", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({q: user_input, state: chat_state}),
    }).catch((e) => {chat_div.innerHTML = e.message})

    const response = await api.json().catch((e) => {chat_div.innerHTML = e.message })

    const make_message = document.createElement('p')
    make_message.innerHTML = response.reply.replaceAll('\n', "")

    chat_div.removeChild(loading_text)
    clearInterval(count_seconds)
    chat_div.appendChild(make_message)

    chat_state.push({user: user_input, agent: response.reply})

    changeTitle("Chat")

    set_current_state(JSON.stringify(chat_state), document.querySelector('main').innerHTML)
}

function set_current_state(ai_state, html_state) {
    sessionStorage.setItem("ai_state", ai_state.toLocaleString())
    sessionStorage.setItem("html_state", html_state)
}

function get_current_state(which_state) {
    if (!which_state) return [sessionStorage.getItem('ai_state'), sessionStorage.getItem('html_state')]

    return sessionStorage.getItem(which_state)
}

function changeTitle(text) {
    const title = document.querySelector('title')
    title.innerText = text
}

async function saveChatIntoDB(ai_state, html_state) {
    changeTitle("Saving...")

    await fetch('https://reflexshop.app.n8n.cloud/webhook/api/save-chat', {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({"ai": ai_state, "html": html_state})
    }).then((response) => {response.json()}).catch((e) => {chat_div.innerHTML = e.message})

    changeTitle("Chat")
}

function new_chat_handler() {
    new_chat.addEventListener("click", () => {
        location.href = location.pathname
        chat_state = []
        sessionStorage.clear()
        document.querySelector('main').innerHTML = ''
    })
}

async function delete_chat_handler() {
    // todo
}

async function handleSendActions() {
    btn_send.addEventListener("click", callAPI)

    save_chat.addEventListener("click", async() => {
        const [ai_state, html_state] = get_current_state("")

        await saveChatIntoDB(ai_state, html_state)
    })

    input_field.addEventListener("keypress", async event => {
        if (event.key === "Enter") {
            event.preventDefault()

            if(input_field.value.trim() !== "") {
                await callAPI()
            }
        }
    })
}