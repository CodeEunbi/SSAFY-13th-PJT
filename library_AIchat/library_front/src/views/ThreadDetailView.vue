<template>
  <div class="full-page-wrapper" v-if="thread && thread.fields && book && book.fields">
    <div class="header">
      <img :src="threadImg" alt="">
      <h1>{{ thread.fields.title }}</h1>
    </div>

    <div class="detail-wrapper">
      <!-- 왼쪽: 책 정보 -->
      <div class="left">
        <img :src="book.fields.cover" alt="">
        <div>
          <h4>{{ book.fields.title }}</h4>
          <p>{{ book.fields.author }} | {{ book.fields.publisher }} | {{ book.fields.pub_date }}</p>
          <p>{{ book.fields.subTitle }}</p>
        </div>
      </div>

      <!-- 오른쪽: 쓰레드 내용 -->
      <div class="right">
        <p>{{ thread.fields.content }}</p>
      </div>
    </div>
  </div>

  <div v-else>
    <p style="color: white; text-align: center; padding-top: 100px;">
      해당 쓰레드를 찾을 수 없습니다.
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import threadImg from '@/assets/threads/img2.jpg'

const route = useRoute()
const thread = ref(null)
const book = ref(null)

const fetchThreadAndBook = async () => {
  try {
    const threadRes = await axios.get(`http://127.0.0.1:8000/api/v1/threads/${route.params.threadId}/`)
    thread.value = {
      pk: threadRes.data.id,
      fields: {
        title: threadRes.data.title,
        content: threadRes.data.content,
        book: threadRes.data.book,
      }
    }

    const bookRes = await axios.get(`http://127.0.0.1:8000/api/v1/books/${thread.value.fields.book}/`)
    book.value = {
      pk: bookRes.data.id,
      fields: {
        title: bookRes.data.title,
        cover: bookRes.data.cover,
        author: bookRes.data.author,
        publisher: bookRes.data.publisher,
        pub_date: bookRes.data.pub_date,
        subTitle: bookRes.data.subTitle,
      }
    }

  } catch (err) {
    console.error('쓰레드 또는 책 정보를 불러오지 못했습니다.', err)
  }
}

onMounted(() => {
  fetchThreadAndBook()
})
</script>


<style scoped>
.full-page-wrapper {
  height: 100vh;
  background-color: #1c1c1e;
  color: white;
  overflow: auto;
  padding: 0 50px;
}

.header {
  position: relative;
  height: 200px;
  overflow: hidden;
  margin-bottom: 30px;
}

.header img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  z-index: 1;
}

.header h1 {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 30px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
  z-index: 2;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.3);
  /* optional: 반투명 배경 */
  padding: 10px 20px;
  border-radius: 10px;
}


.detail-wrapper {
  display: flex;
  flex-direction: row;
}

/* 왼쪽은 고정 높이 */
.left {
  width: 40%;
  background-color: rgba(150, 150, 150, 0.219);
  border-radius: 10px;
  padding: 30px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  flex-shrink: 0;
  /* 줄어들지 않도록 고정 */
}

.left img {
  width: 100px;
  height: 150px;
  margin-right: 20px;
}

.left div {
  width: 60%;
  align-self: center;
  line-height: 30px;
}

.left div h4 {
  font-weight: bold;
}

.right {
  width: 60%;
  background-color: rgba(150, 150, 150, 0.219);
  color: lightgray;
  margin: 5px 15px;
  border-radius: 10px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
</style>
