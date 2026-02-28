---
title: "Feet on the Ground"
date: "2026-02-28"
excerpt: "AI development pulls you toward the conceptual. You need to fight the gravity of ideation and force your work through environments that make it real."
tags: ["process", "workflow", "development", "discipline"]
---

*"With your feet in the air and your head on the ground..."*
— Pixies, *Where Is My Mind?*

## The Trail Behind You

It is easy to get lost working with AI tooling to build software.

So much can be done so quickly. You sketch a concept, rough out a UI, talk through architecture, generate working code. The conversation is satisfying. The velocity is intoxicating. You feel like you're building.

Then you poke your head up and find that you have dozens of ideas in different states of implementation trailing behind you like breadcrumbs leading back to some unrecognizable past. Half-built prototypes. Features that work in isolation but have never been seen together. Concepts that felt complete in the conversation but evaporate when you try to run them.

Your feet are in the air. Your head is on the ground.

## The Gravity of Ideation

For me, the practice of AI development pulls hard toward the conceptual. The ideation phase is *satisfying*. You're talking to your collaborator, building concepts, implementing UI, watching things take shape in code. The conversation has momentum. The ideas are flowing.

And then the session ends.

You close the laptop feeling productive. But productive at what? You generated code, sure. You explored ideas. But did you *see the thing*? Did you run it? Did you feel what it's like to use it?

I've caught myself ending sessions after spending deeply satisfying time in conversation, building concepts, implementing features I've never actually rendered in a browser. That's the trap. The conceptual work feels like the work. But it isn't. Not yet.

## Three Environments, Three Stages of Real

What I'm landing on is a rigorous workflow built around three environments, each one pulling work further from concept and closer to concrete.

### The Workshop

High-level conceptualization happens in a dedicated development environment. For me, that's JDE and OpenClaw. This is where new projects begin: ideation, roughing out features, exploring the shape of a thing before it has a shape.

This environment manages a portal showcasing all projects in progress. Think project management tool meets blogging engine meets artifact repository. Everything in flight is visible. Nothing disappears into a forgotten branch.

The workshop maintains a complete suite of local databases and platforms for testing and development. It's the place where you can move fast and break things because nothing is real yet. Nothing faces outward. You're sketching.

### The Workbench

Locally, it is vital to maintain working copies.

This is the step I've been most tempted to skip, and it's the one that matters most. As soon as a project takes any kind of shape that you can run, you need to run it. Set up the local environment. Get it going. See the thing.

The longer you go in development without doing this, the heavier the task becomes. Debugging accumulates. The gap between product and concept widens. Environmental setup that would have taken minutes early takes hours late. Everything compounds.

Working locally allows for fine-tuning the features roughed out using Claude Code or other integrated tooling. You see the actual behavior. You feel the friction. You notice the thing that's wrong in the first page render, the thing you never would have caught in conversation.

And usually, there is something wrong in the first page render. There always is. That's the point.

### The World

Once the project has a need to be public, preview and production environments should be set up. And the key insight is: do this *before* you show it to anybody.

Setting up deployment early, before there's an audience, gives you space to fully put in place and iterate through the software development lifecycle without pressure. You can go through some cycles. You can break things and fix them. You can discover the gap between "works on my machine" and "works" while nobody is watching.

## Fighting the Pull

The discipline here isn't technical. It's psychological.

I need to fight the urge to end my sessions after spending satisfying time talking to my collaborator, building concepts, implementing UI. The conceptual phase is where the dopamine is. It's where things feel possible and unconstrained and exciting.

But I need to force myself to *see* the thing. And as soon as I see something to change or fix — usually the very first page render — I need that dev environment. I need to be in the workbench, not the workshop. I need my feet on the ground.

The workflow exists to create continuous pressure toward concreteness. Every project should be moving from workshop to workbench to world. If something has been in the workshop for weeks, it's not a project. It's a daydream.

## The Practice

None of this is complicated. Set up your environments. Use them in order. Don't skip steps.

What's hard is the discipline of moving through them. Of resisting the gravitational pull of ideation. Of closing the conversation and opening the browser. Of looking at the thing you've built and confronting the distance between what you imagined and what you see.

That distance is where the real work lives.

---

*This is a workflow I'm actively refining. The environments described here are how I'm structuring my own AI-assisted development practice. The goal is simple: keep your head in the clouds if you want, but keep your feet on the ground.*
