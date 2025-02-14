import request from 'supertest';
import express from 'express';
import queueRoutes from '../queue-management/routes';

const app = express();
app.use(express.json());
app.use('/api/queue', queueRoutes);

describe('Queue Management API', () => {
  it('should create a new queue', async () => {
    const response = await request(app)
      .post('/api/queue/queues')
      .send({ name: 'Test Queue' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Queue created successfully');
  });

  it('should get queue status', async () => {
    const response = await request(app)
      .get('/api/queue/queues/1');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('currentNumber');
  });
}); 