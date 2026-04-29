---
title: "SROP"
date: 2023-08-20 15:14:29
updated: 2023-08-20 15:14:29
categories:
  - "pwn 进阶"
tags:
  - "SROP"
abbrlink: "SROP"
---

<h1 id="高级ROP-SROP"><a href="#高级ROP-SROP" class="headerlink" title="高级ROP-SROP"></a>高级ROP-SROP</h1><p>之前一直没掌握SROP技术，以此篇重新学习一下SROP</p>
<h3 id="利用工具"><a href="#利用工具" class="headerlink" title="利用工具"></a>利用工具</h3><p>在目前的pwntools中已经集成了对于srop的攻击。</p>
<h3 id="使用情况"><a href="#使用情况" class="headerlink" title="使用情况"></a>使用情况</h3><p>在汇编代码中看到存在systemcall的时候可以考虑采用该方法进行尝试</p>
<p>下面给出我们将会用到的64位函数及函数调用号和函数原型</p>
<table>
<thead>
<tr>
<th>系统调用</th>
<th>调用号</th>
<th>函数原型</th>
</tr>
</thead>
<tbody><tr>
<td>read</td>
<td>0</td>
<td>read( int fd, void *buf, size_t count )</td>
</tr>
<tr>
<td>write</td>
<td>1</td>
<td>write( int fd, const void *buf, size_t count )</td>
</tr>
<tr>
<td>sigreturn</td>
<td>15</td>
<td>int sigreturn( … )</td>
</tr>
<tr>
<td>execve</td>
<td>59</td>
<td>execve( const char *filename, char *const argv[], char *const envp[] )</td>
</tr>
</tbody></table>
<p>###使用sigreturn对read函数调用的寄存器进行部署<br>接下来就需要注意了，我们进入构造的阶段。我们需要通过sigreturn的调用来实现对read函数调用寄存器的部署。值得高兴的是pwntools中已经有了调用sigreturn的功能，所以在写EXP的时候可以直接使用。再部署之前我们需要之想好在哪几个寄存器中部署什么值，下面列出来一一讲解</p>
<table>
<thead>
<tr>
<th>寄存器和指令</th>
<th>存储数据</th>
</tr>
</thead>
<tbody><tr>
<td>rax</td>
<td>系统调用号</td>
</tr>
<tr>
<td>rdi</td>
<td>0</td>
</tr>
<tr>
<td>rsi</td>
<td>addr</td>
</tr>
<tr>
<td>rdx</td>
<td>len</td>
</tr>
<tr>
<td>rsp</td>
<td>addr</td>
</tr>
<tr>
<td>rip</td>
<td>syscall_ret</td>
</tr>
</tbody></table>
<blockquote>
<p>首先是rax寄存器中一定是存放read函数的系统调用号啦，因为原汇编代码使用的是syscall，这个不多说了<br>●rdi寄存器作为read函数的一参，0代表标准输入<br>●rsi寄存器作为read函数的二参，里面存放的是前面通过write函数打印出来的新栈顶的地址，也就是说将接收到的信息写到我们前面通过write函数打印的新栈顶的位置<br>●rdx作为read函数的三参写0x400个字节<br>●rsp寄存器需要和rsi保持一致，在写的时候写在rsp指向的位置<br>●rip寄存器指向syscall_ret，确保在read函数寄存器部署成功之后可以直接调用read函数</p>
</blockquote>
