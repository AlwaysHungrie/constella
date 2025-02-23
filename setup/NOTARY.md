# How to setup a Notary Server

sudo apt update
sudo apt install curl build-essential gcc make -y
sudo apt install libssl-dev -y
sudo apt-get install pkg-config -y

curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

https://github.com/tlsnotary/tlsn.git

cd tlsn/crates/notary/server/

change config/config.yaml to have tls disabled and other changes if req

cargo build --release

cp -r config ../../../target/release/
cp -r fixtures ../../../target/release/

sudo apt update
sudo apt install nginx
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx

sudo vim /etc/nginx/sites-available/playground-frontend.constella.one

server {
    listen 80;
    server_name playground-frontend.constella.one;

    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

sudo ln -s /etc/nginx/sites-available/playground-frontend.constella.one /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d playground-frontend.constella.one

nohup ./notary-server > /dev/null 2>&1 &