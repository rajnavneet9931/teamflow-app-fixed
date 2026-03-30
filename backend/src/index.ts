import {ApplicationConfig, BackendApplication} from './application';
import {DeadlineNotifierService} from './services/deadline-notifier.service';
import {TaskModelRepository, NotificationRepository} from './repositories';

export * from './application';

export async function main(options: ApplicationConfig = {}) {
  const app = new BackendApplication(options);
  await app.boot();
  await app.start();

  // Start background deadline-notification poller
  try {
    const taskRepo = await app.get<TaskModelRepository>('repositories.TaskModelRepository');
    const notifRepo = await app.get<NotificationRepository>('repositories.NotificationRepository');
    new DeadlineNotifierService(taskRepo as any, notifRepo as any).start();
    console.log('[DeadlineNotifier] Background deadline checker started.');
  } catch (e) {
    console.error('[DeadlineNotifier] Failed to start:', e);
  }

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);
  console.log(`Try ${url}/ping`);

  return app;
}

if (require.main === module) {
  // Run the application
  const config = {
    rest: {
      port: +(process.env.PORT ?? 3000),
      host: process.env.HOST || '127.0.0.1',
      // The `gracePeriodForClose` provides a graceful close for http/https
      // servers with keep-alive clients. The default value is `Infinity`
      // (don't force-close). If you want to immediately destroy all sockets
      // upon stop, set its value to `0`.
      // See https://www.npmjs.com/package/stoppable
      gracePeriodForClose: 5000, // 5 seconds
      openApiSpec: {
        // useful when used with OpenAPI-to-GraphQL to locate your application
        setServersFromRequest: true,
      },
    },
  };
  main(config).catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}
