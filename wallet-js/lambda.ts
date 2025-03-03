// lambda-function.ts
import axios from 'axios'

// Define the event interface for your Lambda
interface LambdaEvent {
  endpoint: string // The specific endpoint at dummyjson.com to call
  method?: string // HTTP method (GET, POST, etc.)
  params?: any // Query parameters
  body?: any // Request body for POST requests
}

// Define the response type
interface LambdaResponse {
  statusCode: number
  headers: {
    'Content-Type': string
  }
  body: string
}

// Lambda handler function
export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
  try {
    // Set defaults
    const method = event.method || 'GET'
    const baseUrl = 'https://dummyjson.com'
    const url = `${baseUrl}/${event.endpoint}`

    // Make request to dummyjson.com
    const response = await axios({
      method,
      url,
      params: event.params,
      data: event.body,
    })

    // Return successful response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response.data),
    }
  } catch (error) {
    // Handle errors
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: errorMessage }),
    }
  }
}
