FROM gitpod/workspace-full

# https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md
RUN sudo apt-get update \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add - \
    && sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && sudo apt-get update \
    && sudo apt-get install -y google-chrome-stable libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libxshmfence1 \
    && sudo rm -rf /var/lib/apt/lists/*
