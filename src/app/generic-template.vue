<template>

    <div class="slideshow-container">
      <div class="slide" v-for="(element, elementIndex) in elements" :key="element.id">
        <div class="d-flex flex-column">
          <div class="image-container">
            <img :src="element.image_url" @load="onImageLoaded" v-once>
          </div>
          <div class="generic-item">
            <h4 v-once>{{ element.title }}</h4>
            <div class="subtitle">
              <a href="javascript:" v-if="1 < slideIndex" class="prev" @click="changeSlide(-1)">&#10094;</a>
              <a href="javascript:" v-if="slideIndex < elements.length" class="next" @click="changeSlide(1)">&#10095;</a>
              <p v-html="element.subtitle" v-linkified v-once></p>
            </div>
          </div>
          <ul v-if="element.buttons" class="button-container">
            <li v-for="button in element.buttons" :key="button.id">
              <button v-if="button.type === 'postback'" type="button" @click="post(button)" v-once>{{ button.title }}</button>
              <a target="_blank" rel="noopener" v-if="button.type === 'web_url'" :href="button.url" v-once>{{ button.title }}</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
</template>

<script>
  'use strict';
  export default {
    name: 'recime-received-message-generic-template',
    props: {
      service: {
        type: Object
      },
      elements: {
        type: Array
      }
    },
    data () {
      return {
        slideIndex: 1
      }
    },
    mounted () {
      
    },
    methods: {
      changeSlide(n) {
        this.showSlides(this.slideIndex += n, n);
      },

      showSlides(n,m) {
        const slides = this.$el.getElementsByClassName('slide');
        const slideshow = slides[0].parentNode;

        if (n > slides.length) {
          this.slideIndex = 1;
        }

        if (n < 1) {
          this.slideIndex = slides.length
        }
        var c = 0;
        var t = setInterval(function() {
          c++;
          if(m == 1)
            slideshow.style.marginLeft = (-238) * (n-2) - c*2 + 'px';
          else
            slideshow.style.marginLeft = (-238) * n + c*2 + 'px';
          if(c == 120)
          {
            clearInterval(t);
            c = 0;
          }
        },10)
      },

      post(target) {
        this.onBotRespond(false);
        return this.service.post(
          target.title, {
            postback: {
              payload: target.payload
            },
            event: {
              name: target.payload
            }
          })
            .then(() => this.onBotRespond(true))
            .catch(() => this.onBotRespond(true));
      },

      onImageLoaded () {
        this.$emit('imageLoaded');
      },

      onBotRespond(done) {
        this.$emit('botRespond', done);
      }
    }
  }
</script>

<style>
  .recime-received-message-generic-template .slideshow-container {
    width: 1000px;
    position: relative;
    margin: auto;
  }
  .recime-received-message-generic-template .slideshow-container .slide{
    width: 228px;
    float: left;
    margin-right: 10px;
  }

  .recime-received-message-generic-template .slideshow-container .image-container {
    height: 127px;
    min-width: 228px;

  }

  .recime-received-message-generic-template .slideshow-container .image-container img {
    height: 100%;
    width: 100%;
    object-fit: cover;
  }

  .recime-received-message-generic-template .subtitle {
    min-height: 30px;
    position: relative;
  }

  .recime-received-message-generic-template .prev,
  .recime-received-message-generic-template .next {
    display: none;
    cursor: pointer;
    position: absolute;
    top: 0;
    width: auto;
    padding: 10px;
    color: #000;
    font-weight: bold;
    font-size: 15px;
    text-decoration: none;
    opacity: 0.7;
  }
  .recime-received-message-generic-template .generic-item{
    min-height: 134px;
  }
  .recime-received-message-generic-template .slideshow-container:hover .prev,
  .recime-received-message-generic-template .slideshow-container:hover .next {
    display: block;
  }

  .recime-received-message-generic-template .prev {
    left: -10px;
    border-radius: 0 3px 3px 0;
  }

  .recime-received-message-generic-template .next {
    right: -10px;
    border-radius: 3px 0 0 3px;
  }

  @media only screen and (max-width: 300px) {
    .recime-received-message-generic-template .prev,
    .recime-received-message-generic-template .next {
      font-size: 12px
    }
  }
</style>
