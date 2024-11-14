import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';

import { TemplateKind, PartialObjectMetadata } from '../../module/k8s';
import aerogearImg from '../../imgs/logos/aerogear.svg';
import amqImg from '../../imgs/logos/amq.svg';
import angularjsImg from '../../imgs/logos/angularjs.svg';
import ansibleImg from '../../imgs/logos/ansible.svg';
import apacheImg from '../../imgs/logos/apache.svg';
import beakerImg from '../../imgs/logos/beaker.svg';
import buildIconImg from '../../imgs/logos/build-icon.svg';
import camelImg from '../../imgs/logos/camel.svg';
import capedwarfImg from '../../imgs/logos/capedwarf.svg';
import cassandraImg from '../../imgs/logos/cassandra.svg';
import catalogImg from '../../imgs/logos/catalog-icon.svg';
import clojureImg from '../../imgs/logos/clojure.svg';
import codeigniterImg from '../../imgs/logos/codeigniter.svg';
import cordovaImg from '../../imgs/logos/cordova.png';
import datagridImg from '../../imgs/logos/datagrid.svg';
import datavirtImg from '../../imgs/logos/datavirt.svg';
import debianImg from '../../imgs/logos/debian.svg';
import decisionserverImg from '../../imgs/logos/decisionserver.svg';
import djangoImg from '../../imgs/logos/django.svg';
import dotnetImg from '../../imgs/logos/dotnet.svg';
import drupalImg from '../../imgs/logos/drupal.svg';
import eapImg from '../../imgs/logos/eap.svg';
import elasticImg from '../../imgs/logos/elastic.svg';
import erlangImg from '../../imgs/logos/erlang.svg';
import fedoraImg from '../../imgs/logos/fedora.svg';
import freebsdImg from '../../imgs/logos/freebsd.svg';
import giteaImg from '../../imgs/logos/gitea.svg';
import githubImg from '../../imgs/logos/github.svg';
import gitImg from '../../imgs/logos/git.svg';
import gitlabImg from '../../imgs/logos/gitlab.svg';
import glassfishImg from '../../imgs/logos/glassfish.svg';
import goGopherImg from '../../imgs/logos/go-gopher.svg';
import goLangImg from '../../imgs/logos/golang.svg';
import grailsImg from '../../imgs/logos/grails.svg';
import hadoopImg from '../../imgs/logos/hadoop.svg';
import haproxyImg from '../../imgs/logos/haproxy.svg';
import helmImg from '../../imgs/logos/helm.svg';
import infinispanImg from '../../imgs/logos/infinispan.svg';
import intellijImg from '../../imgs/logos/intellij.svg';
import jbossImg from '../../imgs/logos/jboss.svg';
import jenkinsImg from '../../imgs/logos/jenkins.svg';
import jettyImg from '../../imgs/logos/jetty.svg';
import joomlaImg from '../../imgs/logos/joomla.svg';
import jrubyImg from '../../imgs/logos/jruby.svg';
import jsImg from '../../imgs/logos/js.svg';
import knativeImg from '../../imgs/logos/knative.svg';
import kubevirtImg from '../../imgs/logos/kubevirt.svg';
import laravelImg from '../../imgs/logos/laravel.svg';
import loadBalancerImg from '../../imgs/logos/load-balancer.svg';
import mariadbImg from '../../imgs/logos/mariadb.svg';
import mediawikiImg from '../../imgs/logos/mediawiki.svg';
import memcachedImg from '../../imgs/logos/memcached.svg';
import mongodbImg from '../../imgs/logos/mongodb.svg';
import mssqlImg from '../../imgs/logos/mssql.svg';
import mysqlDatabaseImg from '../../imgs/logos/mysql-database.svg';
import nginxImg from '../../imgs/logos/nginx.svg';
import nodejsImg from '../../imgs/logos/nodejs.svg';
import openjdkImg from '../../imgs/logos/openjdk.svg';
import openlibertyImg from '../../imgs/logos/openliberty.svg';
import openshiftImg from '../../imgs/logos/openshift.svg';
import openstackImg from '../../imgs/logos/openstack.svg';
import operatorImg from '../../imgs/logos/operator.svg';
import otherLinuxImg from '../../imgs/logos/other-linux.svg';
import otherUnknownImg from '../../imgs/logos/other-unknown.svg';
import perlImg from '../../imgs/logos/perl.svg';
import phalconImg from '../../imgs/logos/phalcon.svg';
import phpImg from '../../imgs/logos/php.svg';
import playImg from '../../imgs/logos/play.svg';
import postgresqlImg from '../../imgs/logos/postgresql.svg';
import processserverImg from '../../imgs/logos/processserver.svg';
import pythonImg from '../../imgs/logos/python.svg';
import quarkusImg from '../../imgs/logos/quarkus.svg';
import rabbitmqImg from '../../imgs/logos/rabbitmq.svg';
import railsImg from '../../imgs/logos/rails.svg';
import reactImg from '../../imgs/logos/react.svg';
import redhatImg from '../../imgs/logos/redhat.svg';
import redisImg from '../../imgs/logos/redis.svg';
import rhIntegrationImg from '../../imgs/logos/rh-integration.svg';
import rhSpringBoot from '../../imgs/logos/rh-spring-boot.svg';
import rhTomcatImg from '../../imgs/logos/rh-tomcat.svg';
import rubyImg from '../../imgs/logos/ruby.svg';
import rustImg from '../../imgs/logos/rust.svg';
import scalaImg from '../../imgs/logos/scala.svg';
import serverlessFuncImage from '../../imgs/logos/serverlessfx.svg';
import shadowmanImg from '../../imgs/logos/shadowman.svg';
import springBootImg from '../../imgs/logos/spring-boot.svg';
import springImg from '../../imgs/logos/spring.svg';
import ssoImg from '../../imgs/logos/sso.svg';
import stackoverflowImg from '../../imgs/logos/stackoverflow.svg';
import suseImg from '../../imgs/logos/suse.svg';
import symfonyImg from '../../imgs/logos/symfony.svg';
import threeScaleImg from '../../imgs/logos/3scale.svg';
import tomcatImg from '../../imgs/logos/tomcat.svg';
import ubuntuImg from '../../imgs/logos/ubuntu.svg';
import vertxImg from '../../imgs/logos/vertx.svg';
import vscodeImg from '../../imgs/logos/vscode.svg';
import wildflyImg from '../../imgs/logos/wildfly.svg';
import windowsImg from '../../imgs/logos/windows.svg';
import wordpressImg from '../../imgs/logos/wordpress.svg';
import xamarinImg from '../../imgs/logos/xamarin.svg';
import zendImg from '../../imgs/logos/zend.svg';

const logos = new Map<string, any>()
  .set('icon-3scale', threeScaleImg)
  .set('icon-aerogear', aerogearImg)
  .set('icon-amq', amqImg)
  .set('icon-angularjs', angularjsImg)
  .set('icon-ansible', ansibleImg)
  .set('icon-apache', apacheImg)
  .set('icon-beaker', beakerImg)
  .set('icon-build', buildIconImg)
  .set('icon-camel', camelImg)
  .set('icon-capedwarf', capedwarfImg)
  .set('icon-cassandra', cassandraImg)
  .set('icon-catalog', catalogImg)
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
  .set('icon-gitea', giteaImg)
  .set('icon-github', githubImg)
  .set('icon-gitlab', gitlabImg)
  .set('icon-glassfish', glassfishImg)
  .set('icon-go-gopher', goGopherImg)
  .set('icon-golang', goLangImg)
  .set('icon-grails', grailsImg)
  .set('icon-hadoop', hadoopImg)
  .set('icon-haproxy', haproxyImg)
  .set('icon-helm', helmImg)
  .set('icon-httpd', apacheImg)
  .set('icon-infinispan', infinispanImg)
  .set('icon-intellij', intellijImg)
  .set('icon-java', openjdkImg)
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
  .set('icon-operator', operatorImg)
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
  .set('icon-react', reactImg)
  .set('icon-redhat', redhatImg) // Use the upstream icon.
  .set('icon-redis', redisImg)
  .set('icon-rh-integration', rhIntegrationImg)
  .set('icon-rh-openjdk', openjdkImg)
  .set('icon-rh-spring-boot', rhSpringBoot)
  .set('icon-rh-tomcat', rhTomcatImg)
  .set('icon-ruby', rubyImg)
  .set('icon-rust', rustImg)
  .set('icon-scala', scalaImg)
  .set('icon-serverless-function', serverlessFuncImage)
  .set('icon-shadowman', shadowmanImg)
  .set('icon-spring-boot', springBootImg)
  .set('icon-spring', springImg)
  .set('icon-sso', ssoImg)
  .set('icon-stackoverflow', stackoverflowImg)
  .set('icon-suse', suseImg)
  .set('icon-symfony', symfonyImg)
  .set('icon-tomcat', tomcatImg)
  .set('icon-ubuntu', ubuntuImg)
  .set('icon-vertx', vertxImg)
  .set('icon-vscode', vscodeImg)
  .set('icon-wildfly', wildflyImg)
  .set('icon-windows', windowsImg)
  .set('icon-wordpress', wordpressImg)
  .set('icon-xamarin', xamarinImg)
  .set('icon-zend', zendImg);

export const getIcons = (): { label: string; url: string }[] => {
  return Array.from(logos.entries()).map(([iconClass, url]) => ({
    label: iconClass.replace(/^icon-/, ''),
    url,
  }));
};

export const getIcon = (iconName: string) => {
  const url = logos.get(`icon-${iconName}`);
  return url ? { label: iconName, url } : null;
};

export const hasIcon = (iconName: string) => {
  return logos.has(`icon-${iconName}`);
};

export const normalizeIconClass = (iconClass: string): string => {
  return _.startsWith(iconClass, 'icon-') ? `font-icon ${iconClass}` : iconClass;
};

export const getImageForIconClass = (iconClass: string): string => {
  return logos.get(iconClass);
};

export const getImageStreamIcon = (tag: string): string => {
  return _.get(tag, 'annotations.iconClass');
};

export const getTemplateIcon = (template: TemplateKind | PartialObjectMetadata): string => {
  return _.get(template, 'metadata.annotations.iconClass');
};

export const ImageStreamIcon: React.FC<ImageStreamIconProps> = ({ tag, iconSize }) => {
  const { t } = useTranslation();
  const iconClass = getImageStreamIcon(tag);
  const iconClassImg = getImageForIconClass(iconClass);
  return (
    <div className="co-catalog-item-icon">
      <span className="co-catalog-item-icon__bg" aria-hidden>
        {iconClassImg ? (
          <img
            className={classNames(
              'co-catalog-item-icon__img',
              iconSize && `co-catalog-item-icon__img--${iconSize}`,
            )}
            src={iconClassImg}
            alt={t('public~Icon')}
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
    </div>
  );
};

export type ImageStreamIconProps = {
  tag: any;
  iconSize?: string;
};
