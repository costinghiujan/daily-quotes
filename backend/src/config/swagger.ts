/**
 * OpenAPI/Swagger documentation for the Daily Quotes API
 * This file serves as the API reference for all endpoints
 */

export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Daily Quotes API',
    version: '1.0.0',
    description: 'API pentru aplicația Daily Quotes - citate zilnice, prietenii, mesaje și notificări',
    contact: {
      name: 'Daily Quotes Team',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          message: { type: 'string', example: 'Descrierea erorii' },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          message: { type: 'string', example: 'Date invalide' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          username: { type: 'string' },
          email: { type: 'string' },
          full_name: { type: 'string', nullable: true },
          bio: { type: 'string', nullable: true },
          profile_picture_url: { type: 'string', nullable: true },
          cover_photo_url: { type: 'string', nullable: true },
          xp: { type: 'integer' },
          level: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Quote: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          text: { type: 'string' },
          author: { type: 'string' },
          category: { type: 'string', nullable: true },
          user_id: { type: 'integer' },
          likes_count: { type: 'integer' },
          comments_count: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Message: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          sender_id: { type: 'integer' },
          receiver_id: { type: 'integer' },
          text: { type: 'string', nullable: true },
          message_type: { type: 'string', enum: ['TEXT', 'IMAGE', 'DOCUMENT'] },
          media_url: { type: 'string', nullable: true },
          file_name: { type: 'string', nullable: true },
          read_at: { type: 'string', format: 'date-time', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Friendship: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          requester_id: { type: 'integer' },
          addressee_id: { type: 'integer' },
          status: { type: 'string', enum: ['PENDING', 'ACCEPTED', 'REJECTED'] },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'integer' },
          type: { type: 'string' },
          title: { type: 'string' },
          body: { type: 'string' },
          data: { type: 'object' },
          read: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      ScheduledNotification: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'integer' },
          title: { type: 'string' },
          body: { type: 'string' },
          scheduled_time: { type: 'string', format: 'date-time' },
          days_of_week: {
            type: 'array',
            items: { type: 'integer', minimum: 0, maximum: 6 },
          },
          active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Session: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'integer' },
          device_name: { type: 'string' },
          ip_address: { type: 'string' },
          last_active: { type: 'string', format: 'date-time' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Autentificare'],
        summary: 'Înregistrare utilizator nou',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                  username: { type: 'string', minLength: 3, maxLength: 30 },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  full_name: { type: 'string', maxLength: 100 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Cont creat cu succes' },
          '400': { description: 'Date invalide', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } },
          '409': { description: 'Username sau email deja existent' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Autentificare'],
        summary: 'Autentificare utilizator',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Autentificare reușită' },
          '401': { description: 'Email sau parolă incorectă' },
        },
      },
    },
    '/api/quotes': {
      get: {
        tags: ['Citate'],
        summary: 'Obține toate citatele (feed)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de citate',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Quote' },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Neautorizat' },
        },
      },
      post: {
        tags: ['Citate'],
        summary: 'Creează un citat nou',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text', 'author'],
                properties: {
                  text: { type: 'string', maxLength: 1000 },
                  author: { type: 'string', maxLength: 255 },
                  category: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Citat creat cu succes' },
          '400': { description: 'Date invalide' },
        },
      },
    },
    '/api/quotes/mood': {
      post: {
        tags: ['Citate'],
        summary: 'Caută citate după stare (mood)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['mood'],
                properties: {
                  mood: { type: 'string', description: 'Descrierea stării (ex: fericit, trist, inspirat)' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Citate recomandate pentru starea dată' },
          '400': { description: 'Mood-ul este obligatoriu' },
        },
      },
    },
    '/api/quotes/{id}': {
      get: {
        tags: ['Citate'],
        summary: 'Obține un citat după ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'Detalii citat' },
          '404': { description: 'Citatul nu a fost găsit' },
        },
      },
      delete: {
        tags: ['Citate'],
        summary: 'Șterge un citat',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'Citat șters cu succes' },
          '403': { description: 'Nu ai permisiunea să ștergi acest citat' },
          '404': { description: 'Citatul nu a fost găsit' },
        },
      },
    },
    '/api/users/me': {
      get: {
        tags: ['Utilizatori'],
        summary: 'Obține profilul propriu',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Profilul utilizatorului' },
          '401': { description: 'Neautorizat' },
        },
      },
    },
    '/api/users/search': {
      get: {
        tags: ['Utilizatori'],
        summary: 'Caută utilizatori',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Rezultatele căutării' },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        tags: ['Utilizatori'],
        summary: 'Obține profilul unui utilizator',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'Profilul utilizatorului' },
          '404': { description: 'Utilizatorul nu a fost găsit' },
        },
      },
    },
    '/api/friendships': {
      get: {
        tags: ['Prietenii'],
        summary: 'Obține lista de prieteni',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista de prieteni' },
        },
      },
      post: {
        tags: ['Prietenii'],
        summary: 'Trimite cerere de prietenie',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['addressee_id'],
                properties: {
                  addressee_id: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Cerere trimisă' },
          '400': { description: 'Cerere invalidă' },
        },
      },
    },
    '/api/friendships/requests': {
      get: {
        tags: ['Prietenii'],
        summary: 'Obține cererile de prietenie',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista cererilor' },
        },
      },
    },
    '/api/friendships/{id}/accept': {
      put: {
        tags: ['Prietenii'],
        summary: 'Acceptă o cerere de prietenie',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'Cerere acceptată' },
          '404': { description: 'Cererea nu a fost găsită' },
        },
      },
    },
    '/api/friendships/{id}/reject': {
      put: {
        tags: ['Prietenii'],
        summary: 'Respinge o cerere de prietenie',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'Cerere respinsă' },
          '404': { description: 'Cererea nu a fost găsită' },
        },
      },
    },
    '/api/messages': {
      get: {
        tags: ['Mesaje'],
        summary: 'Obține conversațiile',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista conversațiilor' },
        },
      },
    },
    '/api/messages/{userId}': {
      get: {
        tags: ['Mesaje'],
        summary: 'Obține mesajele cu un utilizator',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'Mesajele conversației' },
        },
      },
    },
    '/api/notifications': {
      get: {
        tags: ['Notificări'],
        summary: 'Obține notificările',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista notificărilor' },
        },
      },
    },
    '/api/notifications/read-all': {
      put: {
        tags: ['Notificări'],
        summary: 'Marchează toate notificările ca citite',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Notificări marcate ca citite' },
        },
      },
    },
    '/api/sessions': {
      get: {
        tags: ['Sesiuni'],
        summary: 'Obține sesiunile active',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista sesiunilor active' },
        },
      },
    },
    '/api/sessions/{id}': {
      delete: {
        tags: ['Sesiuni'],
        summary: 'Revocă o sesiune',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'Sesiune revocată' },
          '404': { description: 'Sesiunea nu a fost găsită' },
        },
      },
    },
    '/api/scheduled-notifications': {
      get: {
        tags: ['Notificări Programate'],
        summary: 'Obține notificările programate',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Lista notificărilor programate' },
        },
      },
      post: {
        tags: ['Notificări Programate'],
        summary: 'Creează o notificare programată',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'body', 'scheduled_time'],
                properties: {
                  title: { type: 'string' },
                  body: { type: 'string' },
                  scheduled_time: { type: 'string', format: 'date-time' },
                  days_of_week: {
                    type: 'array',
                    items: { type: 'integer', minimum: 0, maximum: 6 },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Notificare programată creată' },
          '400': { description: 'Date invalide' },
        },
      },
    },
    '/api/scheduled-notifications/{id}': {
      put: {
        tags: ['Notificări Programate'],
        summary: 'Actualizează o notificare programată',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'Notificare actualizată' },
          '404': { description: 'Notificarea nu a fost găsită' },
        },
      },
      delete: {
        tags: ['Notificări Programate'],
        summary: 'Șterge o notificare programată',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'Notificare ștearsă' },
          '404': { description: 'Notificarea nu a fost găsită' },
        },
      },
    },
    '/api/health': {
      get: {
        tags: ['Sănătate'],
        summary: 'Verificare stare server',
        responses: {
          '200': { description: 'Serverul funcționează corect' },
        },
      },
    },
  },
};
