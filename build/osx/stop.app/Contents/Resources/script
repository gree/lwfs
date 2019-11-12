#!/bin/bash

export TOP="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd ../../.. && pwd)"

cd "$TOP"
ps ux | grep 'ruby.*lwfs' | grep -v grep | awk '{print $2}' | xargs -n 1 kill
ps ux | grep 'ruby.*watch.*LWFS' | grep -v grep | awk '{print $2}' | xargs -n 1 kill
