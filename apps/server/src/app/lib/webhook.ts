import axios from 'axios'
import isCI from 'is-ci'
import env from '../../env'
import logger from './logger'

export async function getWebhookUrl(): Promise<string> {
    if (process.env.NODE_ENV === 'development' && !isCI && !env.NX_WEBHOOK_URL) {
        console.log('env.NX_NGROK_URL', env.NX_NGROK_URL)
        try {
            const ngrokUrl = await axios.get(`${env.NX_NGROK_URL}/api/tunnels`).then((res) => {
                const httpsTunnel = res.data.tunnels.find((t) => t.proto === 'https')
                return httpsTunnel.public_url
            })
            console.log('ngrokUrl', ngrokUrl)

            logger.info(`Generated dynamic ngrok webhook URL: ${ngrokUrl}`)

            return ngrokUrl
        } catch (error) {
            console.error('Error getting ngrok URL', error)
            throw error
        }
    }

    logger.info(`Using ${env.NX_WEBHOOK_URL ? env.NX_WEBHOOK_URL : env.NX_API_URL} for webhook URL`)

    return env.NX_WEBHOOK_URL || env.NX_API_URL
}
