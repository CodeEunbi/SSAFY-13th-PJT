<template>
  <div class="full-page-wrapper">
    <div class="books-list-view">
      <!-- 왼쪽 사이드 메뉴 -->
      <aside class="category-menu">
        <div class="search-wrapper">
          <input
            v-model="searchQuery"
            placeholder="검색어를 입력하세요..."
            class="search-input"
          />
        </div>
        <ul>
          <li
            :class="{ active: selectedCategory === '전체' }"
            @click="filterBooks('전체')"
          >
            전체
          </li>
          <li
            v-for="category in categories.filter(c => c.fields.name !== '전체')"
            :key="category.pk"
            :class="{ active: selectedCategory === category.fields.name }"
            @click="filterBooks(category.fields.name)"
          >
            {{ category.fields.name }}
          </li>
        </ul>
      </aside>
      <!-- 오른쪽 도서 카드 리스트 -->
      <main class="book-display">
        <div class="book-grid">
          <RouterLink
            v-for="book in filteredBooks"
            :key="book.pk"
            :to="`/books/${book.pk}`"
            class="book-card"
          >
            <img
              :src="book.fields.cover"
              :alt="book.fields.title"
              class="book-cover"
            />
            <div class="book-info">
              <h3 class="title">{{ book.fields.title }}</h3>
              <p class="meta">{{ book.fields.author }} | {{ book.fields.publisher }} | {{ book.fields.pub_date }}</p>
              <p class="subtitle">{{ book.fields.subTitle }}</p>
            </div>
          </RouterLink>
        </div>
      </main>
    </div>
    <router-view />
  </div>
</template>
<script>
import { RouterLink } from 'vue-router'
import booksData from '@/assets/fixtures/books.json'
import categoriesData from '@/assets/fixtures/categories.json'
export default {
  name: 'BooksListView',
  components: {
    RouterLink,
  },
  data() {
    return {
      books: booksData,
      categories: categoriesData,
      searchQuery: '',
      selectedCategory: '전체',
    }
  },
  computed: {
    selectedCategoryId() {
      if (this.selectedCategory === '전체') return null
      const found = this.categories.find(
        (c) => c.fields.name === this.selectedCategory
      )
      return found ? found.pk : null
    },
    filteredBooks() {
      return this.books.filter((book) => {
        const categoryMatches =
          this.selectedCategory === '전체' ||
          book.fields.category === this.selectedCategoryId
        const searchMatches =
          book.fields.title &&
          book.fields.title.toLowerCase().includes(this.searchQuery.toLowerCase())
        return categoryMatches && searchMatches
      })
    },
  },
  methods: {
    filterBooks(categoryName) {
      this.selectedCategory = categoryName
    },
  },
}
</script>
<style scoped>
.full-page-wrapper {
  width: 100vw;
  height: 100vh;
  background-color: #1c1c1e;
  color: white;
  overflow: auto;
  display: flex;
  justify-content: center;
}
.books-list-view {
  display: flex;
}
.category-menu {
  width: 250px;
  padding: 40px ;
  background-color: #1c1c1e;
  /* flex-shrink: 0; */
  box-sizing: border-box;
}
.search-wrapper {
  width: 100%;
  margin-bottom: 24px;
}
.search-input {
  width: 100%;
  height: 40px;
  font-size: 16px;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #666;
  background-color: #2c2c2e;
  color: white;
}
.search-input::placeholder {
  color: #aaa;
}
.category-menu ul {
  list-style: none;
  padding: 0;
}
.category-menu li {
  padding: 10px 0;
  cursor: pointer;
}
.category-menu li.active {
  color: red;
  font-weight: bold;
}
.book-display {
  flex-grow: 1;
  padding: 32px;
  background-color: #1c1c1e;
}
.book-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
.book-card {
  display: flex;
  background-color: #2c2c2e;
  border-radius: 12px;
  padding: 30px;
  gap: 20px;
  max-width: 600px;
  text-decoration: none;
  color: inherit;
}
.book-cover {
  width: 120px;
  height: 180px;
  object-fit: cover;
  border-radius: 4px;
}
.book-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 3;
}
.title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 6px;
}
.meta {
  font-size: 12px;
  color: gray;
  margin-bottom: 6px;
}
.subtitle {
  font-size: 12px;
  color: white;
}
@media (max-width: 1024px) {
  .books-list-view {
    flex-direction: column;
  }
  .category-menu {
    width: 100%;
    padding: 16px 12px;
  }
  .category-menu ul {
    flex-direction: row !important;
    gap: 12px;
    white-space: normal;
    padding: 0;
    margin: 0;
    scrollbar-width: none;
  }
  .category-menu ul::-webkit-scrollbar {
    display: none;
  }
  .category-menu li {
    display: inline-block !important;
    flex-shrink: 0;
    padding: 8px 16px;
    font-size: 15px;
    white-space: nowrap;
  }
  .category-menu li.active {
    color: red;
    font-weight: bold;
  }
  .book-display {
    padding: 16px;
  }
  .book-grid {
    grid-template-columns: 1fr;
  }
}
</style>