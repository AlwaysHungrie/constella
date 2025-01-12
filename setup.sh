echo "📦 Setting up nitro instance"

sudo amazon-linux-extras install aws-nitro-enclaves-cli -y
sudo yum install aws-nitro-enclaves-cli-devel -y 

sudo usermod -aG ne ec2-user
sudo usermod -aG docker ec2-user
sudo systemctl enable nitro-enclaves-allocator.service
sudo systemctl start nitro-enclaves-allocator.service
nitro-cli --version


echo '📦 install gvproxy'
sudo yum install -y make
sudo yum install golang
git clone https://github.com/containers/gvisor-tap-vsock.git
cd gvisor-tap-vsock
make

echo "✅ Setup done, reboot with 'sudo reboot'"