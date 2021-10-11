#!/usr/bin/expect
# usage ./expect-login.sh <vm name> <vm namespace>
set vm_name [lindex $argv 0]
set vm_namespace [lindex $argv 1]
set login_prompt "(login:|Password:)"
set login_prompt [string trim $login_prompt]

spawn virtctl console $vm_name -n $vm_namespace --timeout 7

sleep 3

send "\n"

set timeout 600

expect {
    -re $login_prompt {}
    timeout { puts "timeout!"; exit 1 }
}

send \003]
