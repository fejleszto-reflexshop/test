const chat_div = document.getElementById("chat_div")
const input_field = document.getElementById("input_text")
const btn_send = document.getElementById("btn_send")

let chat_state = []

async function callAPI() {
    const title = document.querySelector('title')
    title.innerText = "Waiting for response..."
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


    const api = await fetch("https://reflexshop.app.n8n.cloud/webhook/chat", {
        method: "POST",
        body: JSON.stringify({q: user_input, state: chat_state}),
    }).catch((e) => {chat_div.innerHTML = e.message})

    const response = await api.json().catch((e) => {chat_div.innerHTML = e.message })

    const make_message = document.createElement('p')
    make_message.innerHTML = response.reply.replaceAll('\n', "")

    chat_div.removeChild(loading_text)
    clearInterval(count_seconds)
    chat_div.appendChild(make_message)

    chat_state.push({user: user_input, agent: response.reply})

    title.innerText = "Chat"
}

btn_send.addEventListener("click", callAPI)

input_field.addEventListener("keypress", async event => {
    if (event.key === "Enter") {
        event.preventDefault()

        if(input_field.value.trim() !== "") {
            await callAPI()
        }
    }
})