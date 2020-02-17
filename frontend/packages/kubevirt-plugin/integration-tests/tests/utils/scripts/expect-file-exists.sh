#!/usr/bin/expect

set vm_name [lindex $argv 0]
set vm_namespace [lindex $argv 1]
set testfile [lindex $argv 2]
set hostname cirros
set username cirros
set password gocubsgo

set login_prompt "$hostname login: "
set password_prompt "Password: "
set prompt "$"

set response_delay 3
set timeout 10
set send_human {.1 .3 1 .05 2}

spawn virtctl console $vm_name -n $vm_namespace

send -h "\n"

sleep 1

send -h \004

expect $login_prompt {
    sleep $response_delay
    send -h "$username\n"
}

expect $password_prompt {
    sleep $response_delay
    send -h "$password\n"
}

expect $prompt {
    sleep $response_delay
    send -h "test -f $testfile && echo SUCCESS || echo FAILURE\n"
    
    expect $prompt {   
        send -h \004
        expect -re $login_prompt
    }
}

send \003]
