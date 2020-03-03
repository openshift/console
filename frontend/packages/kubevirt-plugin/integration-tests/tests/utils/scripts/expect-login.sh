#!/usr/bin/expect
# usage ./expect-login.sh <vm name> <vm namespace>
set vm_name [lindex $argv 0]
set vm_namespace [lindex $argv 1]
set hostname cirros
set login_prompt "$hostname login: "

spawn virtctl console $vm_name -n $vm_namespace --timeout 7

sleep 3

send "\n"

set timeout 300

expect $login_prompt

send \003]
