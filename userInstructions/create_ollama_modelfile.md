# Creating an Ollama Modelfile for Mistral 7B

To use your downloaded Mistral 7B GGUF model with Ollama, you need to create a `Modelfile` that tells Ollama how to run the model. Here's how:

1.  **Create a Modelfile:**
    *   In the root directory of your project (where the `mistral-7b-instruct-v0.1.Q4_K_M.gguf` file is located), create a new file named `Modelfile` (with no file extension).

2.  **Add the following content to the Modelfile:**
    ```
    FROM ./mistral-7b-instruct-v0.1.Q4_K_M.gguf

    TEMPLATE """{{ if .System }}{{.System}}
    {{ end }}{{ .Prompt }}"""

    PARAMETER temperature 0.7
    PARAMETER top_p 0.9
    PARAMETER top_k 40
    PARAMETER stop "</s>"
    PARAMETER num_ctx 2048
    ```
    *   **Important:** Ensure that the `FROM` line points to the correct path and filename of your Mistral 7B GGUF model.

3.  **Explaination of the Modelfile:**
    *   `FROM ./mistral-7b-instruct-v0.1.Q4_K_M.gguf`: This line specifies the path to the GGUF model file.
    *   `TEMPLATE """..."""`: This defines the template for the prompt that will be sent to the LLM.
    *   `PARAMETER temperature 0.7`: This sets the temperature parameter for the LLM, which controls the randomness of the output.
    *   `PARAMETER top_p 0.9`: This sets the top_p parameter, which controls the diversity of the output.
    *   `PARAMETER top_k 40`: This sets the top_k parameter, which limits the number of tokens considered for each step.
    *   `PARAMETER stop "</s>"`: This sets the stop sequence, which tells the LLM when to stop generating text.
    *   `PARAMETER num_ctx 2048`: This sets the context window size, which determines the amount of text the LLM can consider at once.

Save the `Modelfile` in the root directory.
