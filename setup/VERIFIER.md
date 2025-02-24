# How to setup a Verifier Server

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc 
nvm install --lts
nvm use --lts

npm i -g pnpm
pnpm i

npm run build

npm i -g pm2
pm2 start npm --name "verifier-frontend" -- start

sudo vim /etc/nginx/sites-available/nitro-verifier.pineappl.xyz

server {
    listen 80;
    server_name nitro-verifier.pineappl.xyz;

    location / {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location ^~ /api {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

sudo ln -s /etc/nginx/sites-available/nitro-verifier.pineappl.xyz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d nitro-verifier.pineappl.xyz

// start the server, src/main.js
pm2 start main.js --name "verifier-server" -- -p 3001

