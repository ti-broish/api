import cluster from 'cluster'
import * as os from 'os'
import { Injectable } from '@nestjs/common'

const numCPUs = os.cpus().length

@Injectable()
export class ClusterService {
  static clusterize(callback: () => void): void {
    if (!cluster) {
      callback()
      return
    }

    if (cluster.isPrimary) {
      console.log(`Master server started on ${process.pid}`)
      for (let i = 0; i < numCPUs; i++) {
        cluster.fork()
      }
      cluster.on('exit', (worker, code, signal) => {
        console.log(
          `Worker ${worker.process.pid} died with code ${code} due to ${signal}. Restarting`,
        )
        cluster.fork()
      })
    } else {
      console.log(`Cluster server started on ${process.pid}`)
      callback()
    }
  }
}
