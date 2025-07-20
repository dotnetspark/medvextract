client<llm> CustomGPT4o {
  provider openai
  retry_policy Exponential
  options {
    model "gpt-4o-mini"
    api_key env.OPENAI_API_KEY,
    // Lower temperature for more deterministic outputs
    temperature 0.3
     // Focus on high-probability tokens
    top_p 0.9
    // No penalty for repeated tokens
    frequency_penalty 0.0
    // Increased token limit for detailed outputs
    max_tokens 2000
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