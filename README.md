# ChitChatPortraits-RTC
Transmit audio via WebRTC and receive animated video talking portraits. 🗣️🖼️

# Requirements

- Python 3.11
- Conda 23

# Getting Started

1.Create a Conda environment:
Open your terminal or Anaconda Prompt, navigate to the project directory, and run the following command to create a new Conda environment using the requirements.txt file:
```
conda create --name myenv --file requirements.txt
```


2.Activate the Conda environment:
To activate the newly created environment, run the following command:
```
conda activate myenv
```

Replace myenv with the name of your environment.

3.Install modules that can't be installed with Conda:
```
pip install
```

When you start the example, it will create an HTTP server which you can connect to from your browser:

```
$ python server.py
```
You can then browse to the following page with your browser:
http://127.0.0.1:8080

If you have issues capturing audio, make sure you enabled media access for unsecure sites.

### Credit where credit is due:

Initial code examples from:
- https://github.com/aiortc/aiortc/tree/main
- https://github.com/Automattic/VU-VRM
