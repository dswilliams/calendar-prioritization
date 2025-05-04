# Running the Ollama API with Mistral 7B

Once you have Ollama installed and the `Modelfile` created, you can run the Ollama API with the Mistral 7B model using the following steps:

1.  **Open your terminal.**
2.  **Navigate to the project root directory:**
    ```bash
    cd /Users/Dan/Projects/calendarprioritizer
    ```
3.  **Create the model in Ollama:**
    ```bash
    ollama create calendar-prioritizer -f Modelfile
    ```
    *   This command tells Ollama to create a model named `calendar-prioritizer` using the instructions in the `Modelfile`.

4.  **Run the Ollama API:**
    ```bash
    ollama serve
    ```
    *   This command starts the Ollama API server in the background.

5.  **Run the model:**
    ```bash
    ollama run calendar-prioritizer
    ```

Once these steps are completed, the Ollama API will be running and accessible at `http://localhost:11434`.
