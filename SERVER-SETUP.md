# Серверные настройки для Chrome Extension + GraphQL + Cookies

## Backend настройки (Node.js/Express + GraphQL)

```javascript
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');

const app = express();

// КРИТИЧЕСКИЕ настройки CORS для Chrome расширений
app.use(cors({
  origin: function(origin, callback) {
    // Разрешаем запросы без origin (например, от Postman)
    if (!origin) return callback(null, true);
    
    // Разрешаем веб-приложение
    if (origin === 'https://your-web-app.com') {
      return callback(null, true);
    }
    
    // КРИТИЧНО: Разрешаем Chrome расширения
    if (origin.startsWith('chrome-extension://')) {
      return callback(null, true);
    }
    
    callback(new Error('CORS не разрешен для данного origin'));
  },
  credentials: true, // ОБЯЗАТЕЛЬНО для httpOnly cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Настройки для httpOnly cookies
const COOKIE_CONFIG = {
  httpOnly: true,        // Защита от XSS
  secure: true,          // Только HTTPS
  sameSite: 'none',      // КРИТИЧНО для cross-origin (Chrome расширения)
  maxAge: 15 * 60 * 1000 // 15 минут
};

// GraphQL сервер
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req, res }) => {
    // Извлекаем токены из httpOnly cookies
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;
    
    return {
      req,
      res,
      accessToken,
      refreshToken,
      user: verifyToken(accessToken) // Ваша функция верификации
    };
  }
});

// Аутентификация
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Проверка credentials
    const user = await authenticateUser(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Создание токенов
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    // Установка httpOnly cookies
    res.cookie('accessToken', accessToken, COOKIE_CONFIG);
    res.cookie('refreshToken', refreshToken, {
      ...COOKIE_CONFIG,
      path: '/auth/refresh', // Ограничиваем область действия
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 дней
    });
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Refresh токенов
app.post('/auth/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const user = await getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Создание нового access токена
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    res.cookie('accessToken', newAccessToken, COOKIE_CONFIG);
    
    res.json({ success: true });
    
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Logout
app.post('/auth/logout', (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ success: true });
});
```

## GraphQL схема для Job Tracker

```graphql
type User {
  id: ID!
  email: String!
  name: String!
}

type JobApplication {
  id: ID!
  name: String!
  surname: String!
  position: String!
  company: String!
  status: JobApplicationStatus!
  email: String
  phone: String
  coverLetter: String
  resumeUrl: String
  createdAt: String!
  updatedAt: String!
}

enum JobApplicationStatus {
  PENDING
  APPLIED
  INTERVIEW_SCHEDULED
  INTERVIEW_COMPLETED
  REJECTED
  ACCEPTED
}

input JobApplicationInput {
  name: String!
  surname: String!
  position: String!
  company: String!
  email: String
  phone: String
  coverLetter: String
  resumeUrl: String
}

type Query {
  me: User
  jobApplications(limit: Int, offset: Int): [JobApplication!]!
  jobApplication(id: ID!): JobApplication
}

type Mutation {
  createJobApplication(input: JobApplicationInput!): JobApplication!
  updateJobApplication(id: ID!, input: JobApplicationInput!): JobApplication!
  updateJobApplicationStatus(id: ID!, status: JobApplicationStatus!): JobApplication!
  deleteJobApplication(id: ID!): Boolean!
}
```

## Middleware для проверки аутентификации

```javascript
const authenticateUser = (req, res, next) => {
  const token = req.cookies.accessToken;
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Применяем к защищенным роутам
app.use('/graphql', authenticateUser);
```

## Важные моменты для production

1. **HTTPS везде** - Chrome расширения требуют HTTPS для sameSite=none
2. **Environment variables** - все secrets в .env файлах
3. **Rate limiting** - защита от DDoS
4. **Input validation** - на всех GraphQL резолверах
5. **Error handling** - правильная обработка ошибок без утечки данных
