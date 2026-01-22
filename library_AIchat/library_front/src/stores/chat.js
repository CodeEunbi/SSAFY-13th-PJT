// 📁 src/stores/chat.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useAccountStore } from './accounts'

export const useChatStore = defineStore('chat', () => {
  const accountStore = useAccountStore()

  // const token = localStorage.getItem('token')

  const allMessages = ref({})        // { [bookId]: [messages] }
  const currentBookId = ref(null)
  const messages = ref([])           // 현재 책에 대한 메시지 목록
  const error = ref(null)
  const isLoading = ref(false)
  const API_URL = 'http://127.0.0.1:8000'

  // 현재 책에 대한 페르소나
  const personas = ref({})

  const loadConversation = async function (bookId) {
    try {
      const response = await axios.post(`${API_URL}/api/chat/conversations/`, {
        book_id: bookId,
      }, {
        headers: {
          'Authorization': `Token ${accountStore.token}`
        }
      })

      const { messages: msgList, conversation_id } = response.data

      // 메시지 저장
      const parsedMessages = msgList.map(msg => ({
        sender: msg.is_user ? 'user' : 'bot',
        text: msg.content,
      }))

      allMessages.value[bookId] = parsedMessages
      messages.value = [...parsedMessages]

      if (msgList.length === 0) {
        messages.value.push({
          sender: 'bot',
          text: '작가님에게 질문해보세요!',
        })
      }

      error.value = null

      console.log(`✅ 불러온 대화 (${msgList.length}개)`)
    } catch (err) {
      console.error('❌ 대화 불러오기 실패:', err)
      error.value = '이전 대화 불러오기에 실패했어요.'
    }
  } 

    // 현재 책 선택 시 메시지 설정
const setCurrentBook = async function (bookId) {
  currentBookId.value = bookId
  messages.value = allMessages.value[bookId] || []

  if (!personas.value[bookId]) {
    // ensurePersona 호출하여 결과를 저장
    const personaData = await ensurePersona(bookId)
    if (personaData) {
      personas.value[bookId] = personaData.persona_id  // 또는 필요한 값 전체
    }
  }
}
  
const ensurePersona = async function (bookId) {
  try {
    const response = await axios.post(`${API_URL}/api/chat/ensure_persona/`, {
      book_id: bookId
    }, {
      headers: {
        'Authorization': `Token ${accountStore.token}`
      }
    })

    const { persona_id, created, prompt } = response.data
    console.log(`✅ Persona ${created ? '생성됨' : '이미 존재'}: ID ${persona_id}`)
    return { persona_id, prompt }

  } catch (err) {
    console.error('❌ 페르소나 생성 중 오류:', err)
    error.value = '페르소나 생성에 실패했어요.'
    return null
  }
}

  // 메시지 전송
  const sendMessage = function (question, book) {
    if (!question.trim()) return
    if (!book || typeof book.pk !== 'number') {
      error.value = '도서 정보가 올바르지 않습니다.'
      return
    }

    const bookId = book.pk

    console.log('[DEBUG] 저장된 토큰:', accountStore.token)

    axios({
      method: 'POST',
      url: `${API_URL}/api/chat/`,      
      data: {
        question,
        book,
        persona: personas.value[bookId],  // 현재 페르소나 상태 전달
      },
      headers: {
        'Authorization': `Token ${accountStore.token}`
      }
    })
    .then(res => {
      const botMessage = { sender: 'bot', text: res.data.answer }
      allMessages.value[bookId].push(botMessage)
      messages.value = [...allMessages.value[bookId]]

      // 서버가 업데이트된 페르소나 반환 시 저장
      if (res.data.persona) {
        personas.value[bookId] = res.data.persona
      }
    })
    .catch(err => {
      console.log('이슈: ', err)
    })

    const userMessage = { sender: 'user', text: question }

    error.value = null
    isLoading.value = true

    // 사용자 메시지 먼저 저장
    if (!allMessages.value[bookId]) {
      allMessages.value[bookId] = []
    }
    allMessages.value[bookId].push(userMessage)
    messages.value = [...allMessages.value[bookId]]

  }

  return {
    API_URL,
    messages,
    isLoading,
    error,
    sendMessage,
    setCurrentBook,
    ensurePersona,
    loadConversation,
    allMessages,
    currentBookId,
  }
}, { persist: true })
