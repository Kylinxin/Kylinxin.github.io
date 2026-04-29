---
title: "House of Spirit"
date: 2023-05-14 15:14:29
updated: 2023-05-14 15:14:29
categories:
  - "heap"
tags:
  - "House of 系列"
abbrlink: "House of Spirit"
---

<p>该技术的核心在于在目标位置处伪造 fastbin chunk，并将其释放，从而达到分配指定地址的 chunk 的目的。</p>
<p>要想构造 fastbin fake chunk，并且将其释放时，可以将其放入到对应的 fastbin 链表中，需要绕过一些必要的检测，即</p>
<figure class="highlight irpf90"><table><tbody><tr><td class="gutter"><pre><span class="line">1</span><br><span class="line">2</span><br><span class="line">3</span><br><span class="line">4</span><br><span class="line">5</span><br></pre></td><td class="code"><pre><code class="hljs irpf90">fake chunk 的 ISMMAP 位不能为 <span class="hljs-number">1</span>，因为 <span class="hljs-keyword">free</span> 时，如果是 mmap 的 chunk，会单独处理。<br>fake chunk 地址需要对齐， MALLOC_ALIGN_MASK<br>fake chunk 的 <span class="hljs-built_in">size</span> 大小需要满足对应的 fastbin 的需求，同时也得对齐。<br>fake chunk 的 next chunk 的大小不能小于 <span class="hljs-number">2</span> * SIZE_SZ，同时也不能大于av-&gt;system_mem 。<br>fake chunk 对应的 fastbin 链表头部不能是该 fake chunk，即不能构成 <span class="hljs-keyword">double</span> <span class="hljs-keyword">free</span> 的情况。<br></code></pre></td></tr></tbody></table></figure>

<p>想要使用该技术分配 chunk 到指定地址，其实并不需要修改指定地址的任何内容，关键是要能够修改指定地址的前后的内容使其可以绕过对应的检测。</p>
