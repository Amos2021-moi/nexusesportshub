// Centralized API client with proper error handling and credentials
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`
    try {
      const error = await response.json()
      errorMessage = error.error || error.message || errorMessage
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage)
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

export async function apiFormData<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const response = await fetch(endpoint, {
    method: "POST",
    credentials: "include",
    body: formData,
  })

  if (!response.ok) {
    let errorMessage = `Upload failed with status ${response.status}`
    try {
      const error = await response.json()
      errorMessage = error.error || error.message || errorMessage
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage)
  }

  return response.json()
}