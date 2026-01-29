
import React from "react";
import { img_path } from "../../environment";

type ImageWithBasePathProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
};

const ImageWithBasePath = ({ src, ...rest }: ImageWithBasePathProps) => {
  // Combine the base path and the provided src to create the full image source URL
  const fullSrc = `${img_path}${src}`;
  return <img src={fullSrc} {...rest} />;
};

export default ImageWithBasePath;
