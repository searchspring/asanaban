<template>
    <n-select :options="options" v-model:value="selectedImage" clearable style="min-width: 160px;" size="small"
        placeholder="Select background" />
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { NSelect } from "naive-ui";
import { usePrefStore } from "@/store/preferences";

const imageOpts = {
    "panda 1": "https://www.influxdata.com/wp-content/uploads/pandas-influxdb.jpg",
    "stickys": "https://www.valtech.com/globalassets/15-uk/02-images/04-insights/post-it-notes-1284667_1920.jpg",
    "mountain 1": "https://miro.medium.com/max/7000/1*STTTVL5jx050alkYv1iq9w.jpeg",
    "mountain 2": "https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/moraine-lake-and-the-valley-of-the-ten-peaks-in-the-royalty-free-image-1571062944.jpg",
    "mountain 3": "https://static.independent.co.uk/s3fs-public/thumbnails/image/2019/08/13/11/istock-1092001144.jpg",
    "fat sea weasel": "https://vanaqua.org/application/themes/vanaqua/assets/images/vanaqua-otter.jpg",
    "trash panda": "https://live.staticflickr.com/4885/45193456835_a7ffb5622e_b.jpg",
    "red panda": "https://i.dailymail.co.uk/1s/2020/02/26/22/25245416-0-image-a-18_1582757637588.jpg",
    "penguins": "https://3er1viui9wo30pkxh1v2nh4w-wpengine.netdna-ssl.com/wp-content/uploads/prod/sites/45/2019/11/MS_Penguin-Counting-Story_1900x800.jpg",
    "penguins 2": "https://i.imgur.com/egWdlP2.jpg",
    "hedgehog": "https://ogden_images.s3.amazonaws.com/www.ironmountaindailynews.com/images/2020/03/24112829/Hedgehog3-1100x733.jpg",
    "bunny": "https://www.nydailynews.com/resizer/46J__P5il8SBpVzanAgyALO-Hmk=/1200x0/top/arc-anglerfish-arc2-prod-tronc.s3.amazonaws.com/public/O4TVS77I2W4OWA2UCLZP34EM4Q.jpg",
    "oinker": "https://wallpaperaccess.com/full/30883.jpg",
    "puppers": "https://c4.wallpaperflare.com/wallpaper/551/638/359/animal-images-baby-animals-cool-pictures-cute-animals-wallpaper-preview.jpg"
};

export default defineComponent({
    components: {
        NSelect
    },
    setup() {
        const prefStore = usePrefStore();

        const selectedImage = ref<string | null>(prefStore.backgroundImage);

        watch(selectedImage, () => {
            prefStore.SET_BACKGROUND(selectedImage.value);
        });

        return {
            selectedImage,
            options: makeOptions(imageOpts)
        }
    }
});

function makeOptions(opts: Record<string, string>) {
    return Object.entries(opts).map(([key, value]) => {
        return {
            label: key,
            value
        }
    });
}
</script>