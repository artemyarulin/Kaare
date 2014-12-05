VAGRANTFILE_API_VERSION = "2"


$script = <<SCRIPT

apt-get update
apt-get install git curl redis-server make libevent-dev -y

git clone https://github.com/nicolasff/webdis.git
cd webdis
make
./webdis &

SCRIPT

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "hashicorp/precise32"
  config.vm.provision "shell", inline: $script
  config.vm.network "forwarded_port", guest: 7379, host: 7379
end