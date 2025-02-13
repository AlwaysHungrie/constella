echo "📦 Updating yum and installing git"
sudo yum update
sudo yum install -y git

echo "📦 Installing docker"

sudo yum -y install docker
sudo usermod -a -G docker ec2-user
sudo systemctl enable docker.service
sudo systemctl start docker.service

echo "📦 Setting up nitro instance"

sudo amazon-linux-extras install aws-nitro-enclaves-cli -y
sudo yum install aws-nitro-enclaves-cli-devel -y 
sudo usermod -aG ne ec2-user
nitro-cli --version
sudo systemctl enable nitro-enclaves-allocator.service
sudo systemctl start nitro-enclaves-allocator.service

echo "📦 Installing go"

sudo yum install -y make
sudo yum install golang

echo '📦 install gvproxy'
git clone https://github.com/containers/gvisor-tap-vsock.git
cd gvisor-tap-vsock
make
sudo ln -s $(pwd)/bin/gvproxy /usr/local/bin/gvproxy

echo "✅ Setup done, reboot with 'sudo reboot'"