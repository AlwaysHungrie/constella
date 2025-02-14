## Install Certbot

`sudo amazon-linux-extras install epel -y`

`sudo yum install certbot python2-certbot-nginx -y`

## Create NGINX configuration

`sudo vim /etc/nginx/conf.d/<your-domain>.conf`

```
server {
    listen 80;
    server_name <your-domain>;

    location / {
        proxy_pass http://localhost:7047;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Generate the certificates

There should be an A record for <your-domain> pointing to your server ip before running this command.

`sudo certbot --nginx -d <your-domain>`

## Restart NGINX

`sudo systemctl restart nginx`

Make sure port 443 is not used by any other process like gvproxy.