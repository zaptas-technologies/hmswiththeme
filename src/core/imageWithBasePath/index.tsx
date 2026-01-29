
import React from "react";
import { img_path } from "../../environment";

type ImageWithBasePathProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
};

const ImageWithBasePath = ({ src, ...rest }: ImageWithBasePathProps) => {
  // If src is already absolute (http/https), data URI, or blob, don't prefix img_path.
  const isAbsolute =
    /^https?:\/\//i.test(src) || /^data:/i.test(src) || /^blob:/i.test(src);
  const fullSrc = isAbsolute ? src : `${img_path}${src}`;
  return <img src={fullSrc} {...rest} />;
};

export default ImageWithBasePath;
