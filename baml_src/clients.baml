client<llm> CustomGPT4o {
  provider openai
  retry_policy Exponential
  options {
    model "gpt-4o-mini"
    api_key env.OPENAI_API_KEY,
    temperature 0.3
  }
}

// Retry policy with exponential backoff
retry_policy Exponential {
  max_retries 3
  strategy {
    type exponential_backoff
    delay_ms 300
    multiplier 1.5
    max_delay_ms 10000
  }
}