# K8s Playground
This setup helps me to spin up K8s cluster quickly using AWS CDK and User data.

By running `cdk deploy` creates two instances: One master(t3.medium) and one worker node(t3.micro). Former requires slightly better server since Kubeadm requires 2CPUs and 2GB RAM.


# User data
Instances installed with Docker, Kubelet Kubeadm Kubectl & cri-dockerd. cri-dockerd would let you run Docker Engine via the Kubernetes Container Runtime Interface.


## After instances deployed

SSH into master server, init kubeadm and Configure kubelet to use cri-dockerd.

``` bash
kubeadm init --pod-network-cidr=10.244.0.0/16
```
Refer [link](https://kubernetes.io/docs/tasks/administer-cluster/migrating-from-dockershim/migrate-dockershim-dockerd#configure-the-kubelet-to-use-cri-dockerd) to configure kubelet to use cri-dockerd. 

> **_NOTE:_** After you ran init command, copy kubeadm join command from the output.

On the Master server, set up the kubernetes configuration file for general usage

``` bash
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

On the Master server, apply a common networking plugin. In this case, Flannel
```bash
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
```

On the Worker servers, join them to the cluster using the command you copied earlier.
``` bash
kubeadm join --discovery-token abcdef.1234567890abcdef --discovery-token-ca-cert-hash sha256:1234..cdef 1.2.3.4:6443
```
