import cluster from 'cluster';
import os from 'os';
import { startServer } from './server';

const enableClustering = process.env.CLUSTER === '1' || process.env.NODE_ENV === 'production';

if (enableClustering && cluster.isPrimary) {
  const cpuCount = os.cpus().length;
  for (let i = 0; i < cpuCount; i++) {
    cluster.fork();
  }
  cluster.on('exit', () => {
    cluster.fork();
  });
} else {
  startServer().catch((err) => {
    console.error('Server failed to start', err);
    process.exit(1);
  });
}


