import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';

import { K8sResourceKind, TemplateKind, PartialObjectMetadata } from '../../module/k8s';
import * as threeScaleImg from '../../imgs/logos/3scale.svg';
import * as aerogearImg from '../../imgs/logos/aerogear.svg';
import * as amqImg from '../../imgs/logos/amq.svg';
import * as angularjsImg from '../../imgs/logos/angularjs.svg';
import * as ansibleImg from '../../imgs/logos/ansible.svg';
import * as apacheImg from '../../imgs/logos/apache.svg';
import * as beakerImg from '../../imgs/logos/beaker.svg';
import * as camelImg from '../../imgs/logos/camel.svg';
import * as capedwarfImg from '../../imgs/logos/capedwarf.svg';
import * as catalogImg from '../../imgs/logos/catalog-icon.svg';
import * as cassandraImg from '../../imgs/logos/cassandra.svg';
import * as clojureImg from '../../imgs/logos/clojure.svg';
import * as codeigniterImg from '../../imgs/logos/codeigniter.svg';
import * as cordovaImg from '../../imgs/logos/cordova.png';
import * as datagridImg from '../../imgs/logos/datagrid.svg';
import * as datavirtImg from '../../imgs/logos/datavirt.svg';
import * as debianImg from '../../imgs/logos/debian.svg';
import * as decisionserverImg from '../../imgs/logos/decisionserver.svg';
import * as djangoImg from '../../imgs/logos/django.svg';
import * as dotnetImg from '../../imgs/logos/dotnet.svg';
import * as drupalImg from '../../imgs/logos/drupal.svg';
import * as eapImg from '../../imgs/logos/eap.svg';
import * as elasticImg from '../../imgs/logos/elastic.svg';
import * as erlangImg from '../../imgs/logos/erlang.svg';
import * as fedoraImg from '../../imgs/logos/fedora.svg';
import * as freebsdImg from '../../imgs/logos/freebsd.svg';
import * as gitImg from '../../imgs/logos/git.svg';
import * as githubImg from '../../imgs/logos/github.svg';
import * as gitlabImg from '../../imgs/logos/gitlab.svg';
import * as glassfishImg from '../../imgs/logos/glassfish.svg';
import * as goLangImg from '../../imgs/logos/golang.svg';
import * as grailsImg from '../../imgs/logos/grails.svg';
import * as hadoopImg from '../../imgs/logos/hadoop.svg';
import * as haproxyImg from '../../imgs/logos/haproxy.svg';
import * as helmImg from '../../imgs/logos/helm.svg';
import * as infinispanImg from '../../imgs/logos/infinispan.svg';
import * as jbossImg from '../../imgs/logos/jboss.svg';
import * as jenkinsImg from '../../imgs/logos/jenkins.svg';
import * as jettyImg from '../../imgs/logos/jetty.svg';
import * as joomlaImg from '../../imgs/logos/joomla.svg';
import * as jrubyImg from '../../imgs/logos/jruby.svg';
import * as jsImg from '../../imgs/logos/js.svg';
import * as knativeImg from '../../imgs/logos/knative.svg';
import * as kubevirtImg from '../../imgs/logos/kubevirt.svg';
import * as laravelImg from '../../imgs/logos/laravel.svg';
import * as loadBalancerImg from '../../imgs/logos/load-balancer.svg';
import * as mariadbImg from '../../imgs/logos/mariadb.svg';
import * as mediawikiImg from '../../imgs/logos/mediawiki.svg';
import * as memcachedImg from '../../imgs/logos/memcached.svg';
import * as mongodbImg from '../../imgs/logos/mongodb.svg';
import * as mssqlImg from '../../imgs/logos/mssql.svg';
import * as mysqlDatabaseImg from '../../imgs/logos/mysql-database.svg';
import * as nginxImg from '../../imgs/logos/nginx.svg';
import * as nodejsImg from '../../imgs/logos/nodejs.svg';
import * as openjdkImg from '../../imgs/logos/openjdk.svg';
import * as redhatImg from '../../imgs/logos/redhat.svg';
import * as openlibertyImg from '../../imgs/logos/openliberty.svg';
import * as openshiftImg from '../../imgs/logos/openshift.svg';
import * as openstackImg from '../../imgs/logos/openstack.svg';
import * as otherLinuxImg from '../../imgs/logos/other-linux.svg';
import * as otherUnknownImg from '../../imgs/logos/other-unknown.svg';
import * as perlImg from '../../imgs/logos/perl.svg';
import * as phalconImg from '../../imgs/logos/phalcon.svg';
import * as phpImg from '../../imgs/logos/php.svg';
import * as playImg from '../../imgs/logos/play.svg';
import * as postgresqlImg from '../../imgs/logos/postgresql.svg';
import * as processserverImg from '../../imgs/logos/processserver.svg';
import * as pythonImg from '../../imgs/logos/python.svg';
import * as quarkusImg from '../../imgs/logos/quarkus.svg';
import * as rabbitmqImg from '../../imgs/logos/rabbitmq.svg';
import * as railsImg from '../../imgs/logos/rails.svg';
import * as redisImg from '../../imgs/logos/redis.svg';
import * as rhIntegrationImg from '../../imgs/logos/rh-integration.svg';
import * as rhTomcatImg from '../../imgs/logos/rh-tomcat.svg';
import * as rubyImg from '../../imgs/logos/ruby.svg';
import * as scalaImg from '../../imgs/logos/scala.svg';
import * as shadowmanImg from '../../imgs/logos/shadowman.svg';
import * as springImg from '../../imgs/logos/spring.svg';
import * as ssoImg from '../../imgs/logos/sso.svg';
import * as stackoverflowImg from '../../imgs/logos/stackoverflow.svg';
import * as suseImg from '../../imgs/logos/suse.svg';
import * as symfonyImg from '../../imgs/logos/symfony.svg';
import * as tomcatImg from '../../imgs/logos/tomcat.svg';
import * as ubuntuImg from '../../imgs/logos/ubuntu.svg';
import * as vertxImg from '../../imgs/logos/vertx.svg';
import * as wildflyImg from '../../imgs/logos/wildfly.svg';
import * as windowsImg from '../../imgs/logos/windows.svg';
import * as wordpressImg from '../../imgs/logos/wordpress.svg';
import * as xamarinImg from '../../imgs/logos/xamarin.svg';
import * as zendImg from '../../imgs/logos/zend.svg';

const logos = new Map()
  .set('icon-3scale', threeScaleImg)
  .set('icon-aerogear', aerogearImg)
  .set('icon-amq', amqImg)
  .set('icon-angularjs', angularjsImg)
  .set('icon-ansible', ansibleImg)
  .set('icon-apache', apacheImg)
  .set('icon-beaker', beakerImg)
  .set('icon-camel', camelImg)
  .set('icon-capedwarf', capedwarfImg)
  .set('icon-catalog', catalogImg)
  .set('icon-cassandra', cassandraImg)
  .set('icon-clojure', clojureImg)
  .set('icon-codeigniter', codeigniterImg)
  .set('icon-cordova', cordovaImg)
  .set('icon-datagrid', datagridImg)
  .set('icon-datavirt', datavirtImg)
  .set('icon-debian', debianImg)
  .set('icon-decisionserver', decisionserverImg)
  .set('icon-django', djangoImg)
  .set('icon-dotnet', dotnetImg)
  .set('icon-drupal', drupalImg)
  .set('icon-eap', eapImg)
  .set('icon-elastic', elasticImg)
  .set('icon-erlang', erlangImg)
  .set('icon-fedora', fedoraImg)
  .set('icon-freebsd', freebsdImg)
  .set('icon-git', gitImg)
  .set('icon-github', githubImg)
  .set('icon-gitlab', gitlabImg)
  .set('icon-glassfish', glassfishImg)
  .set('icon-go-gopher', goLangImg)
  .set('icon-golang', goLangImg)
  .set('icon-grails', grailsImg)
  .set('icon-hadoop', hadoopImg)
  .set('icon-haproxy', haproxyImg)
  .set('icon-helm', helmImg)
  .set('icon-infinispan', infinispanImg)
  .set('icon-jboss', jbossImg)
  .set('icon-jenkins', jenkinsImg)
  .set('icon-jetty', jettyImg)
  .set('icon-joomla', joomlaImg)
  .set('icon-jruby', jrubyImg)
  .set('icon-js', jsImg)
  .set('icon-knative', knativeImg)
  .set('icon-kubevirt', kubevirtImg)
  .set('icon-laravel', laravelImg)
  .set('icon-load-balancer', loadBalancerImg)
  .set('icon-mariadb', mariadbImg)
  .set('icon-mediawiki', mediawikiImg)
  .set('icon-memcached', memcachedImg)
  .set('icon-mongodb', mongodbImg)
  .set('icon-mssql', mssqlImg)
  .set('icon-mysql-database', mysqlDatabaseImg)
  .set('icon-nginx', nginxImg)
  .set('icon-nodejs', nodejsImg)
  .set('icon-openjdk', openjdkImg)
  .set('icon-openliberty', openlibertyImg)
  .set('icon-openshift', openshiftImg)
  .set('icon-openstack', openstackImg)
  .set('icon-other-linux', otherLinuxImg)
  .set('icon-other-unknown', otherUnknownImg)
  .set('icon-perl', perlImg)
  .set('icon-phalcon', phalconImg)
  .set('icon-php', phpImg)
  .set('icon-play', playImg)
  .set('icon-postgresql', postgresqlImg)
  .set('icon-processserver', processserverImg)
  .set('icon-python', pythonImg)
  .set('icon-quarkus', quarkusImg)
  .set('icon-rabbitmq', rabbitmqImg)
  .set('icon-rails', railsImg)
  .set('icon-redis', redisImg)
  .set('icon-rh-integration', rhIntegrationImg)
  .set('icon-java', openjdkImg)
  // Use the upstream icon.
  .set('icon-redhat', redhatImg)
  .set('icon-rh-openjdk', openjdkImg)
  .set('icon-rh-tomcat', rhTomcatImg)
  .set('icon-ruby', rubyImg)
  .set('icon-scala', scalaImg)
  .set('icon-shadowman', shadowmanImg)
  .set('icon-spring', springImg)
  .set('icon-sso', ssoImg)
  .set('icon-stackoverflow', stackoverflowImg)
  .set('icon-suse', suseImg)
  .set('icon-symfony', symfonyImg)
  .set('icon-tomcat', tomcatImg)
  .set('icon-ubuntu', ubuntuImg)
  .set('icon-vertx', vertxImg)
  .set('icon-wildfly', wildflyImg)
  .set('icon-windows', windowsImg)
  .set('icon-wordpress', wordpressImg)
  .set('icon-xamarin', xamarinImg)
  .set('icon-zend', zendImg);

export const normalizeIconClass = (iconClass: string): string => {
  return _.startsWith(iconClass, 'icon-') ? `font-icon ${iconClass}` : iconClass;
};

export const getImageForIconClass = (iconClass: string): string => {
  return logos.get(iconClass);
};

export const getServiceClassIcon = (serviceClass: K8sResourceKind): string => {
  return _.get(
    serviceClass,
    ['spec', 'externalMetadata', 'console.openshift.io/iconClass'],
    logos.get('icon-catalog'),
  );
};

export const getServiceClassImage = (serviceClass: K8sResourceKind): string => {
  const iconClass = getServiceClassIcon(serviceClass);
  const iconClassImg = getImageForIconClass(iconClass);
  return _.get(serviceClass, ['spec', 'externalMetadata', 'imageUrl']) || iconClassImg;
};

export const getImageStreamIcon = (tag: string): string => {
  return _.get(tag, 'annotations.iconClass');
};

export const getTemplateIcon = (template: TemplateKind | PartialObjectMetadata): string => {
  return _.get(template, 'metadata.annotations.iconClass');
};

export const ClusterServiceClassIcon: React.FC<ClusterServiceClassIconProps> = ({
  serviceClass,
  iconSize,
}) => {
  const iconClass = getServiceClassIcon(serviceClass);
  const imageUrl = getServiceClassImage(serviceClass);
  return (
    <span className="co-catalog-item-icon">
      {imageUrl ? (
        <img
          className={classNames(
            'co-catalog-item-icon__img',
            iconSize && `co-catalog-item-icon__img--${iconSize}`,
          )}
          src={imageUrl}
        />
      ) : (
        <span
          className={classNames(
            'co-catalog-item-icon__icon',
            iconSize && `co-catalog-item-icon__icon--${iconSize}`,
            normalizeIconClass(iconClass),
          )}
        />
      )}
    </span>
  );
};
ClusterServiceClassIcon.displayName = 'ClusterServiceClassIcon';

export type ClusterServiceClassIconProps = {
  serviceClass: K8sResourceKind;
  iconSize?: string;
};

export const ImageStreamIcon: React.FC<ImageStreamIconProps> = ({ tag, iconSize }) => {
  const iconClass = getImageStreamIcon(tag);
  const iconClassImg = getImageForIconClass(iconClass);
  return (
    <span className="co-catalog-item-icon">
      {iconClassImg ? (
        <img
          className={classNames(
            'co-catalog-item-icon__img',
            iconSize && `co-catalog-item-icon__img--${iconSize}`,
          )}
          src={iconClassImg}
        />
      ) : (
        <span
          className={classNames(
            'co-catalog-item-icon__icon',
            iconSize && `co-catalog-item-icon__icon--${iconSize}`,
            normalizeIconClass(iconClass),
          )}
        />
      )}
    </span>
  );
};

export type ImageStreamIconProps = {
  tag: any;
  iconSize?: string;
};
