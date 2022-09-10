import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import {readFileSync} from 'fs';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // VPC
    const kubevpc = new ec2.Vpc(this, 'kube-vpc', {
      cidr: '192.168.0.0/16',
      natGateways: 0,
      subnetConfiguration: [
        {name: 'public', cidrMask: 24, subnetType: ec2.SubnetType.PUBLIC},
      ],
    });

    // Security Group for the Instance
    const kubeSG = new ec2.SecurityGroup(this, 'kube-sg', {
      vpc: kubevpc,
      allowAllOutbound: true,
    });

    kubeSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'allow SSH access from anywhere',
    );

    kubeSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'allow HTTP traffic from anywhere',
    );

    kubeSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'allow HTTPS traffic from anywhere',
    );

    // Role for the EC2 Instance
    const kubeRole = new iam.Role(this, 'kube-role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')
    });

    // EC2 Instance
    const ec2Instance = new ec2.Instance(this, 'ec2-instance', {
      vpc: kubevpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      role: kubeRole,
      securityGroup: kubeSG,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MICRO,
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      keyName: '2022-05',
    });
    // Load contents of script
    const userDataScript = readFileSync('./lib/user-data.sh', 'utf8');
    // Add the User Data script to the Instance
    ec2Instance.addUserData(userDataScript);

  }
}
